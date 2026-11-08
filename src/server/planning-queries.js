/** Filtres et conversions Prisma partagés : dates sans décalage de fuseau. */
export const asDate = (day) => new Date(`${day}T00:00:00Z`);
export const asTime = (time) => new Date(`1970-01-01T${time}:00Z`);
export const dayText = (value) => value.toISOString().slice(0, 10);
export const timeText = (value) => value.toISOString().slice(11, 16);
export function monthRange(month) {
  const gte = asDate(`${month}-01`);
  const lt = new Date(gte);
  lt.setUTCMonth(lt.getUTCMonth() + 1);
  return { gte, lt };
}
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
export async function draft(tx, teamId, month) {
  return tx.schedule.upsert({
    where: { team_id_month: { team_id: teamId, month } },
    create: { team_id: teamId, month },
    update: { published_at: null },
  });
}
export function taskConflict(task, month) {
  return (
    !task.participant.declarations.some((d) => d.month === month && d.confirmed_at) ||
    task.participant.absences.some((a) => dayText(a.day) === dayText(task.day))
  );
}
export function participantFacts(month) {
  return {
    select: {
      name: true,
      declarations: { where: { month }, select: { month: true, confirmed_at: true } },
      absences: { where: { day: monthRange(month) }, select: { day: true } },
    },
  };
}
