/**
 * @module lib/validation
 * @description Validateurs des données reçues par les routes API et les scripts.
 * Chaque fonction renvoie true si la valeur est valide, false sinon.
 */

/** Courriel valide du domaine @lacitec.on.ca (à passer déjà en minuscules et sans espaces). */
export const isValidEmail = (email) =>
  typeof email === 'string' &&
  email.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
  email.endsWith('@lacitec.on.ca');

/** Mot de passe de 12 à 128 caractères. */
export const isValidPassword = (password) =>
  typeof password === 'string' && password.length >= 12 && password.length <= 128;

/** Texte (nom, titre…) de `min` à `max` caractères, à passer déjà sans espaces autour. */
export const isValidText = (text, min = 2, max = 100) =>
  typeof text === 'string' && text.length >= min && text.length <= max;

/** Date « AAAA-MM-JJ » qui existe vraiment (refuse par exemple le 31 février). */
export const isValidDate = (date) => {
  if (typeof date !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(date)) return false;
  // On relit la date : « 2026-02-31 » deviendrait le 3 mars, donc on la refuse.
  const parsed = new Date(`${date}T12:00:00Z`);
  return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

/** Mois « AAAA-MM » (entre 2000 et 2099). */
export const isValidMonth = (month) => typeof month === 'string' && /^20\d{2}-(0[1-9]|1[0-2])$/.test(month);

/** Heure « HH:MM » sur 24 heures. */
export const isValidTime = (time) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

/** Identifiant UUID (format des clés primaires Prisma). */
export const isValidUuid = (id) =>
  typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/** Lit une chaîne et retire les espaces autour ; renvoie '' si ce n'est pas une chaîne. */
export const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');
