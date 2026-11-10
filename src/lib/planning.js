/**
 * @module lib/planning
 * @description Conversions de dates et filtres Prisma partagés par les routes du planning.
 * Les dates sont manipulées en UTC pour éviter tout décalage de fuseau horaire.
 */

/** « AAAA-MM-JJ » → Date à minuit UTC (colonne SQL de type date). */
export const asDate = (day) => new Date(`${day}T00:00:00Z`);

/** « HH:MM » → Date du 1er janvier 1970 (colonne SQL de type time). */
export const asTime = (time) => new Date(`1970-01-01T${time}:00Z`);

/** Date → « AAAA-MM-JJ ». */
export const dayText = (value) => value.toISOString().slice(0, 10);

/** Date → « HH:MM ». */
export const timeText = (value) => value.toISOString().slice(11, 16);

/** Filtre Prisma couvrant un mois entier : du 1er (inclus) au 1er du mois suivant (exclu). */
export function monthRange(month) {
  const gte = asDate(`${month}-01`);
  const lt = new Date(gte);
  lt.setUTCMonth(lt.getUTCMonth() + 1);
  return { gte, lt };
}

/**
 * Filtre Prisma des participants libres sur un créneau. Il faut :
 * 1. une déclaration validée pour le mois ;
 * 2. aucune absence ce jour-là ;
 * 3. aucune tâche qui chevauche l'horaire.
 * @param {string} teamId
 * @param {{ day: string, start: string, end: string }} slot
 */
export function availableWhere(teamId, slot) {
  return {
    team_id: teamId,
    role: 'participant',
    declarations: { some: { month: slot.day.slice(0, 7), confirmed_at: { not: null } } },
    absences: { none: { day: asDate(slot.day) } },
    tasks: {
      none: {
        day: asDate(slot.day),
        start_time: { lt: asTime(slot.end) },
        end_time: { gt: asTime(slot.start) },
      },
    },
  };
}

/** Sélection Prisma des informations nécessaires pour détecter les conflits d'une tâche. */
export function participantFacts(month) {
  return {
    select: {
      name: true,
      declarations: { where: { month }, select: { month: true, confirmed_at: true } },
      absences: { where: { day: monthRange(month) }, select: { day: true } },
    },
  };
}

/**
 * Une tâche est en conflit si son participant a dévalidé sa déclaration
 * ou s'est déclaré absent le jour de la tâche.
 */
export function taskConflict(task, month) {
  return (
    !task.participant.declarations.some((d) => d.month === month && d.confirmed_at) ||
    task.participant.absences.some((a) => dayText(a.day) === dayText(task.day))
  );
}

/** Repasse le planning du mois en brouillon (dépublié) après toute modification. */
export function markDraft(tx, teamId, month) {
  return tx.schedule.upsert({
    where: { team_id_month: { team_id: teamId, month } },
    create: { team_id: teamId, month },
    update: { published_at: null },
  });
}

/**
 * Verrou PostgreSQL sur (équipe, mois) pendant une transaction :
 * deux modifications simultanées du même mois passent l'une après l'autre.
 */
export async function lockMonth(tx, teamId, month) {
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${`${teamId}:${month}`}, 0))`;
}
