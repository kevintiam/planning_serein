/**
 * @module lib/crypto
 * @description Hachage des mots de passe (bcrypt) et empreintes des jetons (SHA-256).
 * Aucun import « @/ » : ce fichier est aussi utilisé par les scripts Node (admin:create, password:reset).
 */

import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

/** Coût bcrypt : 2^12 tours (≈ 0,2 s par hachage), ce qui freine la force brute. */
const BCRYPT_ROUNDS = 12;

/** Empreinte SHA-256 en hexadécimal (64 caractères) : on stocke ça, jamais le jeton en clair. */
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');

/** Jeton aléatoire de 32 octets, pour les sessions et les codes d'invitation. */
export const randomToken = () => randomBytes(32).toString('base64url');

/**
 * bcrypt ignore tout ce qui dépasse 72 octets. On condense donc d'abord le mot de passe
 * en SHA-256 (44 caractères) pour que toute la phrase de passe compte.
 */
const prehash = (password) => createHash('sha256').update(password, 'utf8').digest('base64');

/** Hache un mot de passe pour le stocker dans User.password_hash. */
export const hashPassword = (password) => bcrypt.hash(prehash(password), BCRYPT_ROUNDS);

/** Compare un mot de passe saisi avec le hachage stocké. */
export const verifyPassword = (password, hash) => bcrypt.compare(prehash(password), hash);

// Hachage factice : si le courriel n'existe pas, on fait quand même une comparaison bcrypt
// pour que le temps de réponse ne révèle pas quels courriels ont un compte.
let dummyHash;
export const getDummyHash = async () => (dummyHash ??= await hashPassword('compte-inexistant'));
