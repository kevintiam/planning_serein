'use client';
/** Dialogue natif : focus confiné, touche Échap et intitulé accessible. */
import { useEffect, useRef } from 'react';
import { useTaskForm } from '../hooks/useTaskForm.js';
import Feedback from './Feedback.jsx';
export default function TaskDialog({ day, onClose, onSaved }) {
  const dialog = useRef(null);
  const { form, members, loading, busy, error, change, submit } = useTaskForm(day, onSaved);
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="task-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <button className="close" type="button" onClick={onClose} disabled={busy} aria-label="Fermer">
        ×
      </button>
      <p className="eyebrow">ORGANISER L’ÉQUIPE</p>
      <h2 id="task-title">Attribuer une tâche</h2>
      <Feedback error={error} />
      <form onSubmit={submit}>
        <label>
          Activité
          <input
            autoFocus
            name="title"
            value={form.title}
            onChange={change}
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <label>
          Date
          <input name="day" type="date" value={form.day} onChange={change} required />
        </label>
        <div className="form-row">
          <label>
            Début
            <input type="time" name="start" value={form.start} onChange={change} required />
          </label>
          <label>
            Fin
            <input type="time" name="end" value={form.end} onChange={change} required />
          </label>
        </div>
        <label>
          Personnes disponibles
          <select
            name="participantId"
            value={form.participantId}
            onChange={change}
            required
            disabled={loading}
          >
            <option value="">{loading ? 'Recherche…' : 'Choisir une personne'}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <p className="hint">
          {loading ? 'Vérification des disponibilités…' : `${members.length} personne(s) disponible(s).`} Les
          personnes indisponibles, déjà occupées ou sans déclaration validée sont masquées.
        </p>
        <button className="primary wide" disabled={busy || loading || !form.participantId}>
          {busy ? 'Enregistrement…' : 'Attribuer la tâche'}
        </button>
      </form>
    </dialog>
  );
}
