'use client';
/** Chargement mensuel annulable, mutations et messages communs au tableau. */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { planningApi } from '../api/planning.js';
import { authApi } from '../api/auth.js';
import { currentMonth, shiftMonth } from '../domain/calendar.js';
export function usePlanning() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [invitation, setInvitation] = useState('');
  const reload = useCallback(
    async (signal) => {
      const result = await planningApi.overview(month, signal);
      setData(result);
    },
    [month],
  );
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setLoading(true);
    setError('');
    setMessage('');
    reload(controller.signal)
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (err.status === 401) router.replace('/connexion');
        else setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload, router]);
  async function mutate(operation, success) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await operation();
      await reload();
      setMessage(success);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function invite() {
    if (!window.confirm('Générer un nouveau code ? L’ancien ne permettra plus de nouvelles inscriptions.'))
      return;
    const result = await mutate(
      () => planningApi.rotateInvitation(),
      'Nouveau code créé. Copiez-le maintenant.',
    );
    if (result) setInvitation(result.invitation);
  }
  async function logout() {
    setBusy(true);
    setError('');
    try {
      await authApi.logout();
      router.replace('/connexion');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return {
    month,
    data,
    loading,
    busy,
    error,
    message,
    invitation,
    reload,
    invite,
    logout,
    moveMonth: (amount) => setMonth((value) => shiftMonth(value, amount)),
    publish: () => mutate(() => planningApi.publish(month), 'Planning publié.'),
    removeTask: (id) => {
      if (window.confirm('Retirer cette tâche du planning ?')) {
        return mutate(() => planningApi.deleteTask(id), 'Tâche retirée.');
      }
    },
  };
}
