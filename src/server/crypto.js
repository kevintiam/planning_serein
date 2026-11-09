/** Mots de passe hachés avec bcrypt ; sessions et invitations à forte entropie. */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import bcrypt from 'bcryptjs';
// Coût bcrypt : 2^12 tours. Chaque +1 double le temps de calcul (≈ 0,2 s ici),
// ce qui freine fortement les attaques par force brute.
const BCRYPT_ROUNDS = 12;
/** Jeton aléatoire de 32 octets (≈ 43 caractères), sûr pour les sessions et les codes d'invitation. */
export const randomToken = () => randomBytes(32).toString('base64url');
/** Empreinte SHA-256 en hexadécimal : sert à stocker jetons et codes sans les garder en clair. */
export const digest = (value) => createHash('sha256').update(value).digest('hex');
/**
 * bcrypt ne lit que les 72 premiers octets d'un mot de passe et ignore le reste en silence.
 * Comme on accepte jusqu'à 128 caractères (phrases de passe, accents sur 2 octets),
 * on condense d'abord le mot de passe en SHA-256 base64 : 44 caractères, tout est pris en compte.
 */
const prehash = (password) => createHash('sha256').update(password, 'utf8').digest('base64');
/**
 * Hache un mot de passe avec bcrypt (le sel aléatoire est inclus dans le résultat).
 * Format stocké : « $2b$12$<sel><empreinte> ».
 */
export async function hashPassword(password) {
  return bcrypt.hash(prehash(password), BCRYPT_ROUNDS);
}
/** Vérifie un mot de passe contre la valeur stockée (bcrypt, ou ancien format scrypt). */
export async function verifyPassword(password, encoded) {
  if (encoded.startsWith('$2')) return bcrypt.compare(prehash(password), encoded);
  if (encoded.startsWith('scrypt$')) return verifyLegacyScrypt(password, encoded);
  return false;
}
/**
 * true si le hachage stocké doit être refait : ancien format scrypt, ou coût bcrypt
 * inférieur au coût actuel. Appelé après une connexion réussie pour migrer en douceur.
 */
export function needsRehash(encoded) {
  return !encoded.startsWith('$2') || bcrypt.getRounds(encoded) < BCRYPT_ROUNDS;
}

// --- Ancien format scrypt : conservé uniquement pour vérifier les comptes créés avant bcrypt. ---
const scrypt = promisify(scryptCallback);
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
/** Vérifie un hachage « scrypt$<sel>$<clé> » (comptes créés avant le passage à bcrypt). */
async function verifyLegacyScrypt(password, encoded) {
  const [, salt, expected] = encoded.split('$');
  if (!salt || !expected) return false;
  const actual = await scrypt(password, salt, 64, SCRYPT_OPTIONS);
  const buffer = Buffer.from(expected, 'hex');
  // timingSafeEqual compare en temps constant : le temps de réponse
  // ne révèle pas combien de caractères étaient corrects.
  return buffer.length === actual.length && timingSafeEqual(buffer, actual);
}
