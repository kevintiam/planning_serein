/** GET /api/auth/me : renvoie l'utilisateur connecté, ou 401. */
import { route, requireUser } from '../../../../server/http.js';
export const GET = route(async () => ({ user: await requireUser() }));
