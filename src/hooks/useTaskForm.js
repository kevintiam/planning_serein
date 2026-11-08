'use client';
/** Les options sont demandées au serveur et annulées si la date change. */
import { useState, useEffect } from 'react';
import { planningApi } from '../api/planning.js';
export function useTaskForm(initialDay, onSaved) {
  const [form, setForm] = useState({
    day: initialDay,
    start: '19:00',
    end: '21:00',
    title: '',
    participantId: '',
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setMembers([]);
    setLoading(true);
    setError('');
    setForm((old) => ({ ...old, participantId: '' }));
    if (!form.day || !form.start || form.end <= form.start) {
      setLoading(false);
      return () => controller.abort();
    }
    planningApi
      .available({ day: form.day, start: form.start, end: form.end }, controller.signal)
      .then((result) => setMembers(result.members))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [form.day, form.start, form.end]);
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
    loading,
    busy,
    error,
    submit,
    change: (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value })),
  };
}
