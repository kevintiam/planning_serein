/** Contrat HTTP d'authentification, appelé exclusivement par les hooks. */
import { request } from './client.js';
export const authApi = {
  // Utilisateur connecté (401 si aucune session).
  me: (signal) => request('/auth/me', { signal }),
  // { email, password } → crée la session (cookie posé par le serveur).
  login: (body) => request('/auth/login', { method: 'POST', body }),
  // { name, email, password, invitation } → crée le compte et la session.
  register: (body) => request('/auth/register', { method: 'POST', body }),
  // Supprime la session côté serveur.
  logout: () => request('/auth/logout', { method: 'POST', body: {} }),
};
