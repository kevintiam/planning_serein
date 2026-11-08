/** Route HTTP mince : validation et délégation au service métier. */
import { route, requireUser, readBody } from '../../../server/http.js';
import { planningService } from '../../../server/planning-service.js';
export const POST = route(async () => planningService.rotateInvitation(await requireUser(true)));
