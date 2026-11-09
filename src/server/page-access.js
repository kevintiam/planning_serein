/** Garde serveur des pages : masquer un menu ne constitue pas une autorisation. */
import { redirect } from 'next/navigation';
import { authService } from './auth-service.js';
import { sessionToken } from './http.js';
/**
 * Protège une page côté serveur.
 * Sans session → /connexion. Mauvais rôle → renvoyé vers son propre espace.
 * @param role 'admin' ou 'participant' (facultatif)
 */
export async function pageUser(role) {
  const user = await authService.session(await sessionToken());
  if (!user) redirect('/connexion');
  if (role && user.role !== role) redirect(user.role === 'admin' ? '/admin' : '/participant');
  return user;
}
