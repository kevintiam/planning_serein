'use client';
/** Vue d'authentification : aucun appel réseau, toute la logique est dans le hook. */
import Link from 'next/link';
import { useAuthForm } from '../hooks/useAuthForm.js';
import Feedback from './Feedback.jsx';
import PlanningPreview from './PlanningPreview.jsx';
/**
 * Formulaire partagé par /connexion et /inscription.
 * @param mode 'login' (connexion) ou 'register' (inscription)
 */
export default function AuthForm({ mode }) {
  const { submit, busy, error } = useAuthForm(mode);
  const signup = mode === 'register';
  return (
    <main className="auth-page">
      <PlanningPreview />
      <section className="auth-card">
        <Link href="/" className="brand">
          <i className="brand-mark" aria-hidden="true" />
          planning<span>serein</span>
        </Link>
        <p className="eyebrow">UN PLANNING POUR TOUS</p>
        <h1>{signup ? 'Rejoignez votre équipe.' : 'Heureux de vous retrouver.'}</h1>
        <p>
          {signup
            ? 'Créez votre compte, puis indiquez vos disponibilités du mois.'
            : 'Connectez-vous à votre espace personnel.'}
        </p>
        <Feedback error={error} />
        {/* Les attributs name des champs deviennent les clés envoyées à l'API. */}
        <form onSubmit={submit}>
          {/* Champs propres à l'inscription : confirmation du mot de passe et code d'invitation. */}
          {signup && (
            <label>
              Votre nom
              <input name="name" required minLength={2} maxLength={100} autoComplete="name" />
            </label>
          )}
          <label>
            Courriel
            <input name="email" type="email" required maxLength={254} autoComplete="email" />
          </label>
          <label>
            Mot de passe
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete={signup ? 'new-password' : 'current-password'}
            />
          </label>
          {signup && (
            <>
              <small>Au moins 12 caractères. Une phrase de passe est bienvenue.</small>
              <label>
                Confirmer le mot de passe
                <input name="confirmPassword" type="password" required autoComplete="new-password" />
              </label>
              <label>
                Code d’invitation de l’équipe
                <input name="invitation" required minLength={20} maxLength={128} autoComplete="off" />
              </label>
              <small>Demandez ce code à votre administrateur.</small>
            </>
          )}
          <button className="primary wide" disabled={busy}>
            {busy ? 'Veuillez patienter…' : signup ? 'Créer mon compte' : 'Me connecter'}
          </button>
        </form>
        <p className="auth-footer">
          {signup ? 'Déjà un compte ?' : 'Vous rejoignez une équipe ?'}{' '}
          <Link href={signup ? '/connexion' : '/inscription'}>
            {signup ? 'Se connecter' : 'Créer un compte'}
          </Link>
        </p>
        {!signup && <small>Mot de passe oublié ? Contactez l’administrateur du site.</small>}
      </section>
    </main>
  );
}
