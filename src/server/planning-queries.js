/** Filtres et conversions Prisma partagés : dates sans décalage de fuseau. */
/** Convertit « AAAA-MM-JJ » en Date à minuit UTC (colonne SQL de type date). */
export const asDate = (day) => new Date(`${day}T00:00:00Z`);
/** Convertit « HH:MM » en Date du 1er janvier 1970 (colonne SQL de type time). */
export const asTime = (time) => new Date(`1970-01-01T${time}:00Z`);
/** Inverse de asDate : Date → « AAAA-MM-JJ ». */
export const dayText = (value) => value.toISOString().slice(0, 10);
/** Inverse de asTime : Date → « HH:MM ». */
export const timeText = (value) => value.toISOString().slice(11, 16);
/** Filtre Prisma couvrant un mois entier : du 1er (inclus) au 1er du mois suivant (exclu). */
export function monthRange(month) {
  const gte = asDate(`${month}-01`);
  const lt = new Date(gte);
  lt.setUTCMonth(lt.getUTCMonth() + 1);
  return { gte, lt };
}
/**
 * Filtre Prisma des participants libres pour un créneau. Il faut :
 * 1. une déclaration validée pour le mois ;
 * 2. aucune absence ce jour-là ;
 * 3. aucune tâche qui chevauche l'horaire (début < fin demandée et fin > début demandé).
 */
export function availableWhere(user, input) {
  return {
    team_id: user.team_id,
    role: 'participant',
    declarations: { some: { month: input.day.slice(0, 7), confirmed_at: { not: null } } },
    absences: { none: { day: asDate(input.day) } },
    tasks: {
      none: {
        day: asDate(input.day),
        start_time: { lt: asTime(input.end) },
        end_time: { gt: asTime(input.start) },
      },
    },
  };
}
/** Repasse le planning du mois en brouillon (dépublié) après toute modification. */
export async function draft(tx, teamId, month) {
  return tx.schedule.upsert({
    where: { team_id_month: { team_id: teamId, month } },
    create: { team_id: teamId, month },
    update: { published_at: null },
  });
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
/** Sélection Prisma des informations nécessaires pour détecter les conflits. */
export function participantFacts(month) {
  return {
    select: {
      name: true,
      declarations: { where: { month }, select: { month: true, confirmed_at: true } },
      absences: { where: { day: monthRange(month) }, select: { day: true } },
    },
  };
}
