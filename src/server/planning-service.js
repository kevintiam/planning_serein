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
function admin(user) {
  if (user.role !== 'admin') throw new AppError('Accès administrateur requis.', 403);
}
export function createPlanningService(db = prisma) {
  return {
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
    async saveDeclaration(user, input) {
      if (user.role !== 'participant') throw new AppError('Déclaration réservée aux participants.', 403);
      return db.$transaction(async (tx) => {
        await lockMonth(tx, user.team_id, input.month);
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
    async available(user, input, executor = db) {
      admin(user);
      return executor.user.findMany({
        where: availableWhere(user, input),
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    },
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
    async rotateInvitation(user) {
      admin(user);
      const invitation = randomToken();
      await db.team.update({ where: { id: user.team_id }, data: { invite_hash: digest(invitation) } });
      return { invitation };
    },
  };
}
export const planningService = createPlanningService();
