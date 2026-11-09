/** Navigation commune : le parent décide s'il faut protéger un brouillon. */
import { monthLabel } from '../domain/calendar.js';
/** Flèche SVG ; `d` est le tracé (vers la gauche ou la droite). */
function Chevron({ d }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
/**
 * Titre du mois et flèches précédent / suivant.
 * @param onMove appelé avec -1 ou +1
 * @param children boutons d'action affichés à droite (ex. « Publier »)
 */
export default function MonthBar({ month, onMove, disabled, children }) {
  return (
    <div className="month-bar">
      <div className="month-nav">
        <h2>{monthLabel(month)}</h2>
        <button aria-label="Mois précédent" disabled={disabled} onClick={() => onMove(-1)}>
          <Chevron d="M15 18l-6-6 6-6" />
        </button>
        <button aria-label="Mois suivant" disabled={disabled} onClick={() => onMove(1)}>
          <Chevron d="M9 18l6-6-6-6" />
        </button>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
