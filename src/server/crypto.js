/** Mots de passe scrypt salés ; sessions et invitations à forte entropie. */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
export const randomToken = () => randomBytes(32).toString('base64url');
export const digest = (value) => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64, options);
  return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const [algorithm, salt, expected] = encoded.split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const actual = await scrypt(password, salt, 64, options);
  const buffer = Buffer.from(expected, 'hex');
  return buffer.length === actual.length && timingSafeEqual(buffer, actual);
}
