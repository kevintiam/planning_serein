/** Message affiché quand personne ne peut prendre le créneau, avec la raison de chaque exclusion. */
import { monthLabel } from '../domain/calendar.js';
/** Accorde le texte selon le nombre : plural(2, 'participant', 'participants') → « 2 participants ». */
const plural = (count, one, many) => `${count} ${count > 1 ? many : one}`;
/**
 * @param summary { total, notValidated, absent, busy } renvoyé par /api/available
 * @param day date du créneau (AAAA-MM-JJ)
 */
export default function NobodyAvailable({ summary, day }) {
  // Date lisible, ex. « mercredi 4 novembre » (12:00 évite les décalages de fuseau).
  const date = new Date(`${day}T12:00:00`).toLocaleDateString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  // Une ligne par raison réellement présente ; les « false » sont retirés par filter.
  const reasons = [
    summary.absent > 0 &&
      `${plural(summary.absent, 'participant s’est déclaré', 'participants se sont déclarés')} indisponible${summary.absent > 1 ? 's' : ''} ce jour-là.`,
    summary.notValidated > 0 &&
      `${plural(summary.notValidated, 'participant n’a', 'participants n’ont')} pas encore validé ${summary.notValidated > 1 ? 'leur' : 'sa'} déclaration de ${monthLabel(day.slice(0, 7))}.`,
    summary.busy > 0 &&
      `${plural(summary.busy, 'participant a', 'participants ont')} déjà une tâche sur ce créneau.`,
  ].filter(Boolean);
  return (
    <div className="nobody" role="status">
      <b>Personne n’est disponible le {date}.</b>
      {summary.total === 0 ? (
        <p>Votre équipe n’a encore aucun participant. Générez un code d’invitation dans « Mon équipe ».</p>
      ) : (
        <ul>
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      <small>Choisissez une autre date ou un autre horaire.</small>
    </div>
  );
}
