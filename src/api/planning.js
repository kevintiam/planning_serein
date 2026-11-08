/** Fonctions réseau du planning ; les composants ne connaissent pas les URL. */
import { request } from './client.js';
export const planningApi = {
  overview: (month, signal) => request(`/planning?month=${encodeURIComponent(month)}`, { signal }),
  saveDeclaration: (body) => request('/declarations', { method: 'PUT', body }),
  available: (input, signal) => request(`/available?${new URLSearchParams(input)}`, { signal }),
  createTask: (body) => request('/tasks', { method: 'POST', body }),
  deleteTask: (id) => request('/tasks', { method: 'DELETE', body: { id } }),
  publish: (month) => request('/publish', { method: 'POST', body: { month } }),
  rotateInvitation: () => request('/invitation', { method: 'POST', body: {} }),
};
