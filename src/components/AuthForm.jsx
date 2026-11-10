'use client';
/** Vue d'authentification : aucun appel réseau, toute la logique est dans le hook. */
import { useState } from 'react';
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitation, setInvitation] = useState('');

  const signup = mode === 'register';

  /** Envoie les valeurs des états au hook : connexion = courriel + mot de passe seulement. */
  function handleSubmit(event) {
    const values = signup ? { name, email, password, confirmPassword, invitation } : { email, password };
    submit(event, values);
  }

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
        {/* Chaque champ est relié à un état (value + onChange) ; handleSubmit envoie ces états. */}
        <form onSubmit={handleSubmit}>
          {/* Champs propres à l'inscription : confirmation du mot de passe et code d'invitation. */}
          {signup && (
            <label>
              Votre nom
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                name="name"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Courriel
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <label>
            Mot de passe
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                />
              </label>
              <label>
                Code d’invitation de l’équipe
                <input
                  value={invitation}
                  onChange={(e) => setInvitation(e.target.value)}
                  name="invitation"
                  required
                  minLength={20}
                  maxLength={128}
                  autoComplete="off"
                />
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
