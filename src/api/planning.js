/** Fonctions réseau du planning ; les composants ne connaissent pas les URL. */
import { request } from './client.js';
export const planningApi = {
  // Données du mois « AAAA-MM » : membres, déclarations, absences, tâches.
  overview: (month, signal) => request(`/planning?month=${encodeURIComponent(month)}`, { signal }),
  // { month, days, confirm } : jours d'absence, en brouillon ou validés.
  saveDeclaration: (body) => request('/declarations', { method: 'PUT', body }),
  // { day, start, end } → participants libres et résumé des exclusions.
  available: (input, signal) => request(`/available?${new URLSearchParams(input)}`, { signal }),
  // { title, day, start, end, participantId } : attribue une tâche.
  createTask: (body) => request('/tasks', { method: 'POST', body }),
  // Retire une tâche.
  deleteTask: (id) => request('/tasks', { method: 'DELETE', body: { id } }),
  // Publie le planning du mois pour les participants.
  publish: (month) => request('/publish', { method: 'POST', body: { month } }),
  // Génère un nouveau code d'invitation (l'ancien devient invalide).
  rotateInvitation: () => request('/invitation', { method: 'POST', body: {} }),
};
