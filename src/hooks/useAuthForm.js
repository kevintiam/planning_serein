'use client';
/** Le formulaire transmet ses valeurs au hook ; lui seul appelle authApi. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth.js';
export function useAuthForm(mode) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'register' && values.password !== values.confirmPassword) {
        throw new Error('Les deux mots de passe doivent être identiques.');
      }
      await authApi[mode](values);
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
