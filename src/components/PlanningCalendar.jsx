/** Planning visuel ; côté administrateur, toute la case d'une date ouvre l'affectation.
    Le bouton de date est étiré sur la case en CSS (pas de bouton imbriqué avec « Retirer »). */
import { monthDays, monthOffset, todayKey, WEEKDAYS } from '../domain/calendar.js';

/**
 * @param tasks tâches du mois (toute l'équipe pour l'admin, les siennes pour un participant)
 * @param admin active les actions d'administration (attribuer, retirer)
 * @param availability { 'AAAA-MM-JJ': nombre de personnes disponibles }
 * @param onDay appelé avec la date cliquée
 * @param onRemove appelé avec l'identifiant de la tâche à retirer
 */
export default function PlanningCalendar({ month, tasks, admin, availability = {}, onDay, onRemove, busy }) {
  const today = todayKey();

  return (
    <div className="calendar-scroll">
      <div className="week-grid">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {/* Cases vides avant le 1er du mois. */}
        {Array.from({ length: monthOffset(month) }, (_, i) => (
          <div key={`blank-${i}`} className="day blank" />
        ))}
        {monthDays(month).map((day) => (
          <div className={`day ${admin ? 'clickable' : ''} ${day === today ? 'today' : ''}`} key={day}>
            {/* Admin : le numéro est un bouton étiré sur toute la case (voir .day-title::after en CSS). */}
            {admin ? (
              <button
                className="day-title"
                onClick={() => onDay(day)}
                aria-label={`Attribuer une tâche le ${day} — ${availability[day] ?? 0} personne(s) disponible(s)`}
              >
                <span>{Number(day.slice(-2))}</span>
                <span className={`day-count ${availability[day] ? '' : 'zero'}`} aria-hidden="true">
                  {availability[day] ?? 0} dispo{availability[day] > 1 ? 's' : ''}
                </span>
              </button>
            ) : (
              <b>{Number(day.slice(-2))}</b>
            )}
            {/* Tâches de ce jour. */}
            {tasks
              .filter((task) => task.day === day)
              .map((task) => (
                <article key={task.id} className={`task ${task.conflict ? 'conflict' : ''}`}>
                  <small>
                    {task.start}–{task.end}
                  </small>
                  <b>{task.title}</b>
                  <span>{task.name}</span>
                  {task.conflict && <small>Disponibilité à revoir</small>}
                  {admin && (
                    <button
                      className="remove"
                      disabled={busy}
                      onClick={() => onRemove(task.id)}
                      aria-label={`Retirer ${task.title}`}
                    >
                      Retirer
                    </button>
                  )}
                </article>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
