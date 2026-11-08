/** Garde serveur des pages : masquer un menu ne constitue pas une autorisation. */
import { redirect } from 'next/navigation';
import { authService } from './auth-service.js';
import { sessionToken } from './http.js';
export async function pageUser(role) {
  const user = await authService.session(await sessionToken());
  if (!user) redirect('/connexion');
  if (role && user.role !== role) redirect(user.role === 'admin' ? '/admin' : '/participant');
  return user;
}
