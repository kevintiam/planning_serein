'use client';
/** Dialogue natif : focus confiné, touche Échap et intitulé accessible. */
import { useEffect, useRef } from 'react';
import { useTaskForm } from '../hooks/useTaskForm.js';
import { ACTIVITIES } from '../domain/activities.js';
import Feedback from './Feedback.jsx';
import NobodyAvailable from './NobodyAvailable.jsx';
/**
 * Fenêtre « Attribuer une tâche ».
 * @param day date cliquée (AAAA-MM-JJ), modifiable dans le formulaire
 * @param onClose ferme la fenêtre
 * @param onSaved appelé après la création de la tâche
 */
export default function TaskDialog({ day, onClose, onSaved }) {
  const dialog = useRef(null);
  const { form, members, summary, loading, busy, error, change, submit } = useTaskForm(day, onSaved);
  // showModal() ouvre le <dialog> natif en mode modal : fond assombri et focus gardé dedans.
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="task-title"
      /* Touche Échap : on ferme nous-mêmes (sauf pendant un envoi) pour garder React synchronisé. */
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
          {/* Liste fixe définie dans src/domain/activities.js. */}
          <select autoFocus name="title" value={form.title} onChange={change} required>
            <option value="">Choisir une activité</option>
            {ACTIVITIES.map((activity) => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </select>
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
        {/* Personne de libre : on explique pourquoi au lieu d'afficher une liste vide. */}
        {!loading && !members.length && summary ? (
          <NobodyAvailable summary={summary} day={form.day} />
        ) : (
          <>
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
              {loading
                ? 'Vérification des disponibilités…'
                : `${members.length} personne${members.length > 1 ? 's' : ''} disponible${members.length > 1 ? 's' : ''} sur ce créneau.`}
            </p>
          </>
        )}
        <button className="primary wide" disabled={busy || loading || !form.participantId}>
          {busy ? 'Enregistrement…' : 'Attribuer la tâche'}
        </button>
      </form>
    </dialog>
  );
}
