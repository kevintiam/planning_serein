'use client';
/** Chargement mensuel annulable, actions serveur (fetch) et messages communs au tableau. */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { currentMonth, shiftMonth } from '../domain/calendar.js';
/** État principal de l'espace : mois affiché, données, messages et actions serveur. */
export function usePlanning() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // busy = une action est en cours : les boutons sont désactivés.
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // Dernier code d'invitation généré (visible une seule fois).
  const [invitation, setInvitation] = useState('');
  // Recharge les données du mois affiché : GET /api/planning?month=AAAA-MM.
  const reload = useCallback(
    async (signal) => {
      const response = await fetch(`/api/planning?month=${encodeURIComponent(month)}`, {
        signal,
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const err = new Error(result.error || 'La requête a échoué.');
        // Le code HTTP sert à détecter une session expirée (401).
        err.status = response.status;
        throw err;
      }
      setData(result);
    },
    [month],
  );
  // Chargement à chaque changement de mois. La requête précédente est annulée
  // pour qu'une réponse lente n'écrase pas le mois le plus récent.
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setLoading(true);
    setError('');
    setMessage('');
    reload(controller.signal)
      .catch((err) => {
        if (err.name === 'AbortError') return;
        // Session expirée : retour à la page de connexion.
        if (err.status === 401) router.replace('/connexion');
        else setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload, router]);
  /**
   * Envoie une action au serveur (fetch), recharge le mois puis affiche le message de succès.
   * @param url     route API, par exemple '/api/publish'
   * @param method  'POST', 'PUT' ou 'DELETE'
   * @param body    données envoyées en JSON
   * @param success message affiché si tout s'est bien passé
   * @returns la réponse du serveur, ou null en cas d'erreur (le message d'erreur est affiché).
   */
  async function mutate(url, method, body, success) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'La requête a échoué.');
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
  /** Nouveau code d'invitation. La confirmation est demandée par ConfirmDialog avant cet appel. */
  async function invite() {
    const result = await mutate('/api/invitation', 'POST', {}, 'Nouveau code créé. Copiez-le maintenant.');
    if (result) setInvitation(result.invitation);
  }
  /** Déconnexion (POST /api/auth/logout) puis retour à la page de connexion. */
  async function logout() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) throw new Error('La déconnexion a échoué.');
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
    // Passe au mois précédent (-1) ou suivant (+1).
    moveMonth: (amount) => setMonth((value) => shiftMonth(value, amount)),
    publish: () => mutate('/api/publish', 'POST', { month }, 'Planning publié.'),
    removeTask: (id) => {
      if (window.confirm('Retirer cette tâche du planning ?')) {
        return mutate('/api/tasks', 'DELETE', { id }, 'Tâche retirée.');
      }
    },
  };
}
