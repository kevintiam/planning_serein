'use client';
/** Sélection locale puis envoi explicite du mois : aucune sauvegarde cachée. */
import { useEffect, useState } from 'react';
import { planningApi } from '../api/planning.js';
import { toggleWeekday } from '../domain/calendar.js';
export function useDeclaration(user, month, data, reload) {
  const [days, setDays] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    setDays(data?.absences.filter((row) => row.user_id === user.id).map((row) => row.day) || []);
    setDirty(false);
    setError('');
    setMessage('');
  }, [data, user.id, month]);
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
  const edit = (transform) => {
    setDays(transform);
    setDirty(true);
    setMessage('');
  };
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
    confirmed: !dirty && Boolean(data?.declarations.find((row) => row.user_id === user.id)?.confirmed_at),
    toggle: (day) =>
      edit((old) => (old.includes(day) ? old.filter((value) => value !== day) : [...old, day].sort())),
    toggleWeek: (weekday) => edit((old) => toggleWeekday(month, old, weekday)),
    save,
  };
}
