/** Contrat HTTP d'authentification, appelé exclusivement par les hooks. */
import { request } from './client.js';
export const authApi = {
  me: (signal) => request('/auth/me', { signal }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST', body: {} }),
};
