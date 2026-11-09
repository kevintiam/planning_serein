/** Calculs de calendrier sans conversion implicite vers le fuseau UTC. */
/** En-têtes des colonnes : la semaine commence le lundi. */
export const WEEKDAYS = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];
/** Mois en cours au format « AAAA-MM », selon l’heure locale. */
export function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
/**
 * Tous les jours d’un mois : ["AAAA-MM-01", …].
 * Astuce : le jour 0 du mois suivant est le dernier jour du mois demandé.
 */
export function monthDays(month) {
  const [year, index] = month.split('-').map(Number);
  const length = new Date(year, index, 0).getDate();
  return Array.from({ length }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
}
/**
 * Nombre de cases vides avant le 1er dans une grille qui commence le lundi.
 * getDay() renvoie 0 pour dimanche : « + 6 » puis « % 7 » le décale en fin de semaine.
 * L'heure 12:00 évite tout basculement de date lié au fuseau horaire.
 */
export function monthOffset(month) {
  return (new Date(`${month}-01T12:00:00`).getDay() + 6) % 7;
}
/** Libellé lisible, par exemple « novembre 2026 ». */
export function monthLabel(month) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
}
/** Avance ou recule de `amount` mois (gère le passage d’une année à l’autre). */
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
/** Date locale du jour, au même format que les cases du calendrier. */
export function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
/** Nombre de participants disponibles par jour : déclaration validée et pas d'absence ce jour-là.
    Les horaires des tâches ne sont pas pris en compte ici (le dialogue les vérifie). */
export function dailyAvailability(month, members, declarations, absences) {
  const validated = new Set(declarations.filter((row) => row.confirmed_at).map((row) => row.user_id));
  const ready = members.filter((member) => validated.has(member.id));
  const absent = new Set(absences.map((row) => `${row.user_id}|${row.day}`));
  return Object.fromEntries(
    monthDays(month).map((day) => [day, ready.filter((member) => !absent.has(`${member.id}|${day}`)).length]),
  );
}
