/** Planning visuel ; cliquer sur une date ouvre l'affectation côté administrateur. */
import { monthDays, monthOffset, WEEKDAYS } from '../domain/calendar.js';
export default function PlanningCalendar({ month, tasks, admin, onDay, onRemove, busy }) {
  return (
    <div className="calendar-scroll">
      <div className="week-grid">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: monthOffset(month) }, (_, i) => (
          <div key={`blank-${i}`} className="day blank" />
        ))}
        {monthDays(month).map((day) => (
          <div className="day" key={day}>
            {admin ? (
              <button
                className="day-title"
                onClick={() => onDay(day)}
                aria-label={`Attribuer une tâche le ${day}`}
              >
                {Number(day.slice(-2))}
                <span>＋</span>
              </button>
            ) : (
              <b>{Number(day.slice(-2))}</b>
            )}
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
