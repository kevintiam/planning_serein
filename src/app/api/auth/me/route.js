/** Route HTTP mince : validation et délégation au service métier. */
import { route, requireUser } from '../../../../server/http.js';
export const GET = route(async () => ({ user: await requireUser() }));
