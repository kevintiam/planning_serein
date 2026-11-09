'use client';
/** Chargement mensuel annulable, mutations et messages communs au tableau. */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { planningApi } from '../api/planning.js';
import { authApi } from '../api/auth.js';
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
  // Recharge les données du mois affiché.
  const reload = useCallback(
    async (signal) => {
      const result = await planningApi.overview(month, signal);
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
   * Exécute une action serveur, recharge le mois puis affiche le message de succès.
   * Renvoie le résultat, ou null en cas d'erreur (le message d'erreur est affiché).
   */
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
  /** La confirmation est demandée par la fenêtre ConfirmDialog avant cet appel. */
  async function invite() {
    const result = await mutate(
      () => planningApi.rotateInvitation(),
      'Nouveau code créé. Copiez-le maintenant.',
    );
    if (result) setInvitation(result.invitation);
  }
  /** Déconnexion puis retour à la page de connexion. */
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
    // Passe au mois précédent (-1) ou suivant (+1).
    moveMonth: (amount) => setMonth((value) => shiftMonth(value, amount)),
    publish: () => mutate(() => planningApi.publish(month), 'Planning publié.'),
    removeTask: (id) => {
      if (window.confirm('Retirer cette tâche du planning ?')) {
        return mutate(() => planningApi.deleteTask(id), 'Tâche retirée.');
      }
    },
  };
}
