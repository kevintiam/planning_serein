/** POST /api/auth/login : vérifie les identifiants, limite les tentatives et pose le cookie de session. */
import { route, readBody, setSession, limitAttempts } from '../../../../server/http.js';
import { authService } from '../../../../server/auth-service.js';
import { loginSchema } from '../../../../domain/validation.js';
// Hachage bcrypt et vérification des anciens comptes scrypt : runtime Node.js, pas Edge.
export const runtime = 'nodejs';
export const POST = route(async (request) => {
  const input = await readBody(request, loginSchema);
  // Au plus 10 essais par courriel toutes les 15 minutes (contre la force brute).
  await limitAttempts('login:' + input.email);
  await setSession(await authService.login(input));
  return { authenticated: true };
});
