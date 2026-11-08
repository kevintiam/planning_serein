/** Navigation commune : le parent décide s'il faut protéger un brouillon. */
import { monthLabel } from '../domain/calendar.js';
export default function MonthBar({ month, onMove, disabled, children }) {
  return (
    <div className="month-bar">
      <div className="month-nav">
        <h2>{monthLabel(month)}</h2>
        <button aria-label="Mois précédent" disabled={disabled} onClick={() => onMove(-1)}>
          ‹
        </button>
        <button aria-label="Mois suivant" disabled={disabled} onClick={() => onMove(1)}>
          ›
        </button>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
