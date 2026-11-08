/** Route HTTP mince : validation et délégation au service métier. */
import { route, readBody, setSession, limitAttempts } from '../../../../server/http.js';
import { authService } from '../../../../server/auth-service.js';
import { loginSchema } from '../../../../domain/validation.js';
export const runtime = 'nodejs';
export const POST = route(async (request) => {
  const input = await readBody(request, loginSchema);
  await limitAttempts('login:' + input.email);
  await setSession(await authService.login(input));
  return { authenticated: true };
});
