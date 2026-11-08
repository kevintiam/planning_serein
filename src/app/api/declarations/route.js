/** Route HTTP mince : validation et délégation au service métier. */
import { route, requireUser, readBody } from '../../../server/http.js';
import { planningService } from '../../../server/planning-service.js';
import { declarationSchema } from '../../../domain/validation.js';
export const PUT = route(async (request) => {
  const user = await requireUser();
  return planningService.saveDeclaration(user, await readBody(request, declarationSchema));
});
