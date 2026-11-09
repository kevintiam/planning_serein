'use client';
/** Sélection locale puis envoi explicite du mois : aucune sauvegarde cachée. */
import { useEffect, useState } from 'react';
import { planningApi } from '../api/planning.js';
import { toggleWeekday } from '../domain/calendar.js';
/**
 * Déclaration d'absences du participant pour le mois affiché.
 * Les clics modifient une sélection locale ; rien n'est envoyé avant « Enregistrer » ou « Valider ».
 */
export function useDeclaration(user, month, data, reload) {
  const [days, setDays] = useState([]);
  // dirty = des changements ne sont pas encore enregistrés.
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // À chaque chargement de mois, on repart des absences enregistrées sur le serveur.
  useEffect(() => {
    setDays(data?.absences.filter((row) => row.user_id === user.id).map((row) => row.day) || []);
    setDirty(false);
    setError('');
    setMessage('');
  }, [data, user.id, month]);
  // Avertit le navigateur avant de quitter la page s'il reste des changements non enregistrés.
  useEffect(() => {
    const warn = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  // Applique une modification locale et marque la déclaration comme modifiée.
  const edit = (transform) => {
    setDays(transform);
    setDirty(true);
    setMessage('');
  };
  /**
   * Envoie la sélection au serveur.
   * @param confirm true pour valider le mois, false pour un simple brouillon
   */
  async function save(confirm) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await planningApi.saveDeclaration({ month, days, confirm });
      await reload();
      setDirty(false);
      setMessage(
        confirm
          ? 'Disponibilités validées et transmises.'
          : 'Brouillon enregistré. Pensez à valider le mois.',
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return {
    days,
    dirty,
    busy,
    error,
    message,
    // Validée = enregistrée côté serveur ET aucun changement local depuis.
    confirmed: !dirty && Boolean(data?.declarations.find((row) => row.user_id === user.id)?.confirmed_at),
    // Ajoute ou retire un jour de la sélection (la liste reste triée).
    toggle: (day) =>
      edit((old) => (old.includes(day) ? old.filter((value) => value !== day) : [...old, day].sort())),
    // Sélectionne ou retire tous les lundis, mardis… du mois.
    toggleWeek: (weekday) => edit((old) => toggleWeekday(month, old, weekday)),
    save,
  };
}
