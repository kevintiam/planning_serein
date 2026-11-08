/** Route HTTP mince : validation et délégation au service métier. */
import { route, readBody, setSession, limitAttempts } from '../../../../server/http.js';
import { authService } from '../../../../server/auth-service.js';
import { registerSchema } from '../../../../domain/validation.js';
export const runtime = 'nodejs';
export const POST = route(async (request) => {
  const input = await readBody(request, registerSchema);
  await limitAttempts('register:' + input.email, 5);
  await limitAttempts('invitation:' + input.invitation, 30);
  await setSession(await authService.register(input));
  return { registered: true };
});
