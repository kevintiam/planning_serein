/** Route HTTP mince : validation et délégation au service métier. */
import { route, sessionToken, setSession } from '../../../../server/http.js';
import { authService } from '../../../../server/auth-service.js';
export const POST = route(async () => {
  await authService.logout(await sessionToken());
  await setSession('');
  return { loggedOut: true };
});
