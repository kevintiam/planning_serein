/** POST /api/auth/logout : supprime la session en base et efface le cookie. */
import { route, sessionToken, setSession } from '../../../../server/http.js';
import { authService } from '../../../../server/auth-service.js';
export const POST = route(async () => {
  await authService.logout(await sessionToken());
  // Un jeton vide efface le cookie (maxAge 0).
  await setSession('');
  return { loggedOut: true };
});
