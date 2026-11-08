/** Frontière HTTP : CSRF, validation, cookies de session et erreurs uniformes. */
import { cookies } from 'next/headers';
import { ZodError } from 'zod';
import { authService } from './auth-service.js';
import { AppError } from './errors.js';
export { limitAttempts } from './rate-limit.js';
const COOKIE = 'planning_session';
export async function sessionToken() {
  return (await cookies()).get(COOKIE)?.value;
}
export async function setSession(token) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: token ? 60 * 60 * 24 * 7 : 0,
  });
}
export async function requireUser(adminOnly = false) {
  const user = await authService.session(await sessionToken());
  if (!user) throw new AppError('Veuillez vous connecter.', 401);
  if (adminOnly && user.role !== 'admin') throw new AppError('Accès réservé à l’administrateur.', 403);
  return user;
}
export async function readBody(request, schema) {
  const text = await request.text();
  if (text.length > 12_000) throw new AppError('Requête trop volumineuse.', 413);
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AppError('JSON invalide.');
  }
  return schema.parse(data);
}
export function route(handler) {
  return async (request) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        if (!process.env.APP_URL) throw new Error('APP_URL manque.');
        if (request.headers.get('origin') !== new URL(process.env.APP_URL).origin) {
          throw new AppError('Origine de la requête refusée.', 403);
        }
      }
      const data = await handler(request);
      return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      const status = error instanceof ZodError ? 400 : error.status || 500;
      const message =
        error instanceof ZodError
          ? error.issues[0].message
          : status < 500
            ? error.message
            : 'Une erreur serveur est survenue.';
      // Aucun mot de passe, jeton ou objet de requête n'est journalisé.
      if (status >= 500) console.error('Erreur serveur:', error.code || error.name);
      return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
    }
  };
}
