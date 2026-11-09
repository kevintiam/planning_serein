/** POST /api/invitation (admin) : génère un nouveau code d'invitation et invalide l'ancien. */
import { route, requireUser } from '../../../server/http.js';
import { planningService } from '../../../server/planning-service.js';
export const POST = route(async () => planningService.rotateInvitation(await requireUser(true)));
