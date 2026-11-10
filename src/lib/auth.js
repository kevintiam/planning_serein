/**
 * @module lib/auth
 * @description Sessions : création, lecture du cookie, contrôle des rôles et limite de tentatives.
 *
 * - requireUser(request, role) : routes API → { user } ou { error } (réponse 401/403 prête).
 * - pageUser(role)             : pages serveur → utilisateur, ou redirection.
 * - createSession(userId)      : crée la ligne Session et renvoie le jeton du cookie.
 * - isRateLimited(key, max)    : compteur anti force brute (table RateLimit).
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma.js';
import { sha256, randomToken } from '@/lib/crypto.js';

/** Nom du cookie de session. */
export const COOKIE_NAME = 'planning_session';

/** Durée d'une session : 7 jours. */
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Options du cookie de session.
 * httpOnly : illisible par le JavaScript du navigateur ; sameSite lax : bloque les POST venant d'autres sites.
 * @param {number} maxAge - durée en secondes (0 = effacer le cookie)
 */
export const cookieOptions = (maxAge = SESSION_DURATION_MS / 1000) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge,
});

/**
 * Crée une session de 7 jours. Le jeton en clair part dans le cookie ;
 * seule son empreinte est stockée en base.
 * @param {string} userId
 * @param {Object} db - client Prisma ou transaction en cours
 * @returns {Promise<string>} le jeton à mettre dans le cookie
 */
export async function createSession(userId, db = prisma) {
  const token = randomToken();
  await db.session.create({
    data: {
      token_hash: sha256(token),
      user_id: userId,
      expires_at: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });
  return token;
}

/**
 * Retrouve l'utilisateur lié à un jeton de session.
 * @returns {Promise<Object|null>} { id, team_id, name, email, role, team_name }, ou null.
 */
async function getUserFromToken(token) {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token_hash: sha256(token) },
    include: {
      user: {
        select: {
          id: true,
          team_id: true,
          name: true,
          email: true,
          role: true,
          team: { select: { name: true } },
        },
      },
    },
  });

  // Session inexistante ou expirée
  if (!session || session.expires_at <= new Date()) return null;

  const { team, ...user } = session.user;
  return { ...user, team_name: team.name };
}

/**
 * Vérifie la session d'une requête API.
 * @param {import("next/server").NextRequest} request
 * @param {'admin'|'participant'} [role] - rôle exigé (facultatif)
 * @returns {Promise<{ user?: Object, error?: NextResponse }>}
 */
export async function requireUser(request, role) {
  const user = await getUserFromToken(request.cookies.get(COOKIE_NAME)?.value);
  if (!user) {
    return { error: NextResponse.json({ error: 'Veuillez vous connecter.' }, { status: 401 }) };
  }
  if (role && user.role !== role) {
    const message = role === 'admin' ? 'Accès administrateur requis.' : 'Accès réservé aux participants.';
    return { error: NextResponse.json({ error: message }, { status: 403 }) };
  }
  return { user };
}

/**
 * Protège une page serveur. Sans session → /connexion ; mauvais rôle → son propre espace.
 * @param {'admin'|'participant'} [role]
 */
export async function pageUser(role) {
  const user = await getUserFromToken((await cookies()).get(COOKIE_NAME)?.value);
  if (!user) redirect('/connexion');
  if (role && user.role !== role) redirect(user.role === 'admin' ? '/admin' : '/participant');
  return user;
}

/**
 * Compte une tentative pour `key` sur une fenêtre de 15 minutes.
 * @param {string} key - par exemple « login:courriel »
 * @param {number} max - nombre de tentatives autorisées
 * @returns {Promise<boolean>} true si la limite est dépassée.
 */
export async function isRateLimited(key, max) {
  const hashedKey = sha256(key);
  const now = new Date();
  const counter = await prisma.rateLimit.findUnique({ where: { key: hashedKey } });
  const expired = !counter || counter.reset_at <= now;
  const attempts = expired ? 1 : counter.attempts + 1;
  const reset_at = expired ? new Date(now.getTime() + 15 * 60 * 1000) : counter.reset_at;

  await prisma.rateLimit.upsert({
    where: { key: hashedKey },
    create: { key: hashedKey, attempts, reset_at },
    update: { attempts, reset_at },
  });

  return attempts > max;
}
