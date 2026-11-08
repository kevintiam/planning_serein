/** Calendrier de déclaration : dates sélectionnées = journées indisponibles. */
import { monthDays, monthOffset, WEEKDAYS } from '../domain/calendar.js';
import Feedback from './Feedback.jsx';
export default function AvailabilityCalendar({ month, declaration }) {
  const { days, toggle, toggleWeek, save, busy, confirmed, dirty, error, message } = declaration;
  return (
    <>
      <div className="explanation">
        <strong>1. Sélectionnez vos jours indisponibles.</strong>
        <p>
          Les autres jours seront disponibles après validation. Cliquez sur un jour de semaine pour
          sélectionner toutes ses dates.
        </p>
      </div>
      <Feedback error={error} message={message} />
      <div className="calendar-scroll">
        <div className="week-grid">
          {WEEKDAYS.map((day, index) => (
            <button
              key={day}
              disabled={busy}
              onClick={() => toggleWeek((index + 1) % 7)}
              title={`Sélectionner ou retirer tous les ${day}`}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="calendar-grid">
          {Array.from({ length: monthOffset(month) }, (_, index) => (
            <div className="day blank" key={`blank-${index}`} />
          ))}
          {monthDays(month).map((day) => (
            <button
              key={day}
              disabled={busy}
              onClick={() => toggle(day)}
              aria-pressed={days.includes(day)}
              aria-label={`${day} : ${days.includes(day) ? 'indisponible' : 'disponible'}`}
              className={`day selectable ${days.includes(day) ? 'unavailable' : ''}`}
            >
              <strong>{Number(day.slice(-2))}</strong>
              <span>{days.includes(day) ? 'Indisponible' : 'Disponible'}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="submit-bar">
        <div>
          <b>{confirmed ? 'Déclaration validée' : dirty ? 'Modifications non enregistrées' : 'À valider'}</b>
          <small>
            {days.length} jour(s) indisponible(s) · {monthDays(month).length - days.length} jour(s)
            disponible(s)
          </small>
        </div>
        <div className="actions">
          <button disabled={busy || (!dirty && confirmed)} onClick={() => save(false)}>
            Enregistrer le brouillon
          </button>
          <button className="primary" disabled={busy || confirmed} onClick={() => save(true)}>
            {busy ? 'Enregistrement…' : '2. Valider le mois'}
          </button>
        </div>
      </div>
    </>
  );
}
