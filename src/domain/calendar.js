/** Calculs de calendrier sans conversion implicite vers le fuseau UTC. */
export const WEEKDAYS = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];
export function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
export function monthDays(month) {
  const [year, index] = month.split('-').map(Number);
  const length = new Date(year, index, 0).getDate();
  return Array.from({ length }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
}
export function monthOffset(month) {
  return (new Date(`${month}-01T12:00:00`).getDay() + 6) % 7;
}
export function monthLabel(month) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
}
export function shiftMonth(month, amount) {
  const [year, index] = month.split('-').map(Number);
  const date = new Date(year, index - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
/** Sélectionner à nouveau un jour de semaine entièrement coché le décoche. */
export function toggleWeekday(month, selected, weekday) {
  const days = monthDays(month).filter((day) => new Date(`${day}T12:00:00`).getDay() === weekday);
  const next = new Set(selected);
  const remove = days.every((day) => next.has(day));
  days.forEach((day) => (remove ? next.delete(day) : next.add(day)));
  return [...next].sort();
}
