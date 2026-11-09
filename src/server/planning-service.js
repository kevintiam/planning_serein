/** Services métier Prisma : les composants et les contrats HTTP restent identiques. */
import { prisma, lockMonth } from './database.js';
import { AppError } from './errors.js';
import { digest, randomToken } from './crypto.js';
import {
  asDate,
  asTime,
  dayText,
  timeText,
  monthRange,
  availableWhere,
  draft,
  taskConflict,
  participantFacts,
} from './planning-queries.js';
/** Garde : seul l'administrateur peut appeler la méthode. */
function admin(user) {
  if (user.role !== 'admin') throw new AppError('Accès administrateur requis.', 403);
}
/** Fabrique du service planning ; `db` est injectable pour les tests. */
export function createPlanningService(db = prisma) {
  return {
    /**
     * Données d'un mois pour l'écran principal.
     * L'admin voit toute l'équipe ; un participant ne voit que ses propres données,
     * et ses tâches uniquement une fois le planning publié.
     */
    async overview(user, month) {
      const team_id = user.team_id;
      const isAdmin = user.role === 'admin';
      const state = await db.schedule.findUnique({ where: { team_id_month: { team_id, month } } });
      const published = Boolean(state?.published_at);
      const members = isAdmin
        ? await db.user.findMany({
            where: { team_id, role: 'participant' },
            select: { id: true, name: true, email: true, role: true },
            orderBy: { name: 'asc' },
          })
        : [];
      // Filtre supplémentaire : un participant ne lit que ses propres lignes.
      const owned = isAdmin ? {} : { user_id: user.id };
      const declarations = await db.declaration.findMany({
        where: { team_id, month, ...owned },
        select: { user_id: true, confirmed_at: true, updated_at: true },
      });
      const absences = await db.absence.findMany({
        where: { team_id, day: monthRange(month), ...owned },
        select: { user_id: true, day: true },
        orderBy: { day: 'asc' },
      });
      const tasks =
        isAdmin || published
          ? await db.task.findMany({
              where: { team_id, day: monthRange(month), ...(isAdmin ? {} : { participant_id: user.id }) },
              include: { participant: participantFacts(month) },
              orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
            })
          : [];
      return {
        month,
        published,
        members,
        declarations,
        absences: absences.map((a) => ({ ...a, day: dayText(a.day) })),
        tasks: tasks.map((t) => ({
          id: t.id,
          participant_id: t.participant_id,
          day: dayText(t.day),
          start: timeText(t.start_time),
          end: timeText(t.end_time),
          title: t.title,
          name: t.participant.name,
          conflict: taskConflict(t, month),
        })),
      };
    },
    /**
     * Enregistre les jours d'absence d'un participant pour un mois.
     * confirm = true valide la déclaration ; false la garde en brouillon.
     */
    async saveDeclaration(user, input) {
      if (user.role !== 'participant') throw new AppError('Déclaration réservée aux participants.', 403);
      return db.$transaction(async (tx) => {
        // Verrou : empêche deux modifications simultanées du même mois de l'équipe.
        await lockMonth(tx, user.team_id, input.month);
        // On remplace entièrement les absences du mois par la nouvelle sélection.
        await tx.absence.deleteMany({ where: { user_id: user.id, day: monthRange(input.month) } });
        const days = [...new Set(input.days)];
        if (days.length)
          await tx.absence.createMany({
            data: days.map((day) => ({
              user_id: user.id,
              team_id: user.team_id,
              day: asDate(day),
            })),
          });
        const confirmed_at = input.confirm ? new Date() : null;
        await tx.declaration.upsert({
          where: { user_id_month: { user_id: user.id, month: input.month } },
          create: { user_id: user.id, team_id: user.team_id, month: input.month, confirmed_at },
          update: { confirmed_at, updated_at: new Date() },
        });
        await draft(tx, user.team_id, input.month);
        return { saved: true };
      });
    },
    /** Liste des participants libres pour un créneau (nom et identifiant). */
    async available(user, input, executor = db) {
      admin(user);
      return executor.user.findMany({
        where: availableWhere(user, input),
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    },
    /** Explique une liste vide : combien de participants sont écartés, et pour quelle raison. */
    async availabilitySummary(user, input, executor = db) {
      admin(user);
      const month = input.day.slice(0, 7);
      const team = { team_id: user.team_id, role: 'participant' };
      const validated = { ...team, declarations: { some: { month, confirmed_at: { not: null } } } };
      const [total, confirmed, absent, available] = await Promise.all([
        executor.user.count({ where: team }),
        executor.user.count({ where: validated }),
        executor.user.count({ where: { ...validated, absences: { some: { day: asDate(input.day) } } } }),
        executor.user.count({ where: availableWhere(user, input) }),
      ]);
      return { total, notValidated: total - confirmed, absent, busy: confirmed - absent - available };
    },
    /**
     * Attribue une tâche. La disponibilité est revérifiée sous verrou :
     * l'état a pu changer depuis l'ouverture de la fenêtre.
     */
    async createTask(user, input) {
      admin(user);
      return db.$transaction(async (tx) => {
        const month = input.day.slice(0, 7);
        await lockMonth(tx, user.team_id, month);
        const person = await tx.user.findFirst({
          where: { id: input.participantId, ...availableWhere(user, input) },
          select: { id: true },
        });
        if (!person) throw new AppError('Participant indisponible, occupé ou déclaration non validée.', 409);
        const task = await tx.task.create({
          data: {
            team_id: user.team_id,
            participant_id: input.participantId,
            day: asDate(input.day),
            start_time: asTime(input.start),
            end_time: asTime(input.end),
            title: input.title,
          },
          select: { id: true },
        });
        await draft(tx, user.team_id, month);
        return task;
      });
    },
    /** Retire une tâche de l'équipe et repasse le mois en brouillon. */
    async deleteTask(user, id) {
      admin(user);
      return db.$transaction(async (tx) => {
        const task = await tx.task.findFirst({ where: { id, team_id: user.team_id }, select: { day: true } });
        if (!task) throw new AppError('Tâche introuvable.', 404);
        const month = dayText(task.day).slice(0, 7);
        await lockMonth(tx, user.team_id, month);
        await tx.task.deleteMany({ where: { id, team_id: user.team_id } });
        await draft(tx, user.team_id, month);
        return { deleted: true };
      });
    },
    /**
     * Publie le mois : les participants voient alors leurs tâches.
     * Refusé tant qu'une tâche est en conflit.
     */
    async publish(user, month) {
      admin(user);
      return db.$transaction(async (tx) => {
        await lockMonth(tx, user.team_id, month);
        const tasks = await tx.task.findMany({
          where: { team_id: user.team_id, day: monthRange(month) },
          include: { participant: participantFacts(month) },
        });
        if (tasks.some((t) => taskConflict(t, month)))
          throw new AppError('Résolvez les conflits et les déclarations en attente avant de publier.', 409);
        const published_at = new Date();
        await tx.schedule.upsert({
          where: { team_id_month: { team_id: user.team_id, month } },
          create: { team_id: user.team_id, month, published_at },
          update: { published_at },
        });
        return { published: true };
      });
    },
    /**
     * Génère un nouveau code d'invitation et invalide l'ancien.
     * Seule l'empreinte est stockée : le code en clair n'est renvoyé qu'une fois.
     */
    async rotateInvitation(user) {
      admin(user);
      const invitation = randomToken();
      await db.team.update({ where: { id: user.team_id }, data: { invite_hash: digest(invitation) } });
      return { invitation };
    },
  };
}
/** Instance unique utilisée par les routes API. */
export const planningService = createPlanningService();
