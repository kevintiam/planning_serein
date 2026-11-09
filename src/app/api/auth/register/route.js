/** POST /api/auth/register : inscription avec code d'invitation, tentatives limitées, session ouverte. */
import { route, readBody, setSession, limitAttempts } from '../../../../server/http.js';
import { authService } from '../../../../server/auth-service.js';
import { registerSchema } from '../../../../domain/validation.js';
// Hachage bcrypt et vérification des anciens comptes scrypt : runtime Node.js, pas Edge.
export const runtime = 'nodejs';
export const POST = route(async (request) => {
  const input = await readBody(request, registerSchema);
  // Limites : 5 essais par courriel et 30 par code d'invitation, toutes les 15 minutes.
  await limitAttempts('register:' + input.email, 5);
  await limitAttempts('invitation:' + input.invitation, 30);
  await setSession(await authService.register(input));
  return { registered: true };
});
