'use client';
/** Les options sont demandées au serveur et annulées si la date change. */
import { useState, useEffect } from 'react';
import { planningApi } from '../api/planning.js';
/**
 * Formulaire « Attribuer une tâche ».
 * @param initialDay date cliquée dans le calendrier
 * @param onSaved appelé après la création (recharge et ferme la fenêtre)
 */
export function useTaskForm(initialDay, onSaved) {
  const [form, setForm] = useState({
    day: initialDay,
    start: '19:00',
    end: '21:00',
    title: '',
    participantId: '',
  });
  const [members, setMembers] = useState([]);
  // Résumé des exclusions, utilisé quand personne n'est disponible.
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Recharge la liste des personnes disponibles dès que la date ou l'horaire change.
  // La personne choisie est effacée : elle n'est peut-être plus libre sur le nouveau créneau.
  useEffect(() => {
    const controller = new AbortController();
    setMembers([]);
    setSummary(null);
    setLoading(true);
    setError('');
    setForm((old) => ({ ...old, participantId: '' }));
    // Horaire incomplet ou fin avant le début : inutile d'interroger le serveur.
    if (!form.day || !form.start || form.end <= form.start) {
      setLoading(false);
      return () => controller.abort();
    }
    planningApi
      .available({ day: form.day, start: form.start, end: form.end }, controller.signal)
      .then((result) => {
        setMembers(result.members);
        setSummary(result.summary ?? null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [form.day, form.start, form.end]);
  /** Crée la tâche ; en cas d'erreur, la fenêtre reste ouverte avec le message. */
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await planningApi.createTask(form);
      await onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return {
    form,
    members,
    summary,
    loading,
    busy,
    error,
    submit,
    // Met à jour le champ modifié grâce à son attribut name.
    change: (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value })),
  };
}
