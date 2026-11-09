'use client';
/** Le formulaire transmet ses valeurs au hook ; lui seul appelle authApi. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth.js';
/**
 * Gère l'envoi du formulaire de connexion ou d'inscription.
 * @param mode 'login' ou 'register' (nom de la méthode d'authApi appelée)
 */
export function useAuthForm(mode) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    // Récupère tous les champs du formulaire par leur attribut name.
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'register' && values.password !== values.confirmPassword) {
        throw new Error('Les deux mots de passe doivent être identiques.');
      }
      await authApi[mode](values);
      // /espace redirige ensuite vers /admin ou /participant selon le rôle.
      router.replace('/espace');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return { submit, busy, error };
}
