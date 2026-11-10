'use client';
/** Le formulaire transmet ses valeurs (useState) au hook ; le hook les envoie au backend avec fetch. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
/**
 * Gère l'envoi du formulaire de connexion ou d'inscription.
 * @param mode 'login' (→ POST /api/auth/login) ou 'register' (→ POST /api/auth/register)
 */
export function useAuthForm(mode) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /**
   * @param event  événement submit du formulaire (pour bloquer le rechargement de la page)
   * @param values valeurs des useState du formulaire, par exemple { email, password }
   */
  async function submit(event, values) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      // La confirmation sert seulement à vérifier la saisie : elle n'est pas envoyée au backend.
      const { confirmPassword, ...body } = values;
      if (mode === 'register' && body.password !== confirmPassword) {
        throw new Error('Les deux mots de passe doivent être identiques.');
      }
      // Envoi au backend : le serveur répond { error } en cas de problème.
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'La requête a échoué.');
      // Succès : le cookie de session est posé. /espace redirige ensuite vers /admin ou /participant selon le rôle.
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
