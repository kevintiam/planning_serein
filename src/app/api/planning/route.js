/** Route HTTP mince : validation et délégation au service métier. */
import { route, requireUser, readBody } from '../../../server/http.js';
import { planningService } from '../../../server/planning-service.js';
import { monthSchema } from '../../../domain/validation.js';
export const GET = route(async (request) => {
  const user = await requireUser();
  const month = monthSchema.parse(new URL(request.url).searchParams.get('month'));
  return planningService.overview(user, month);
});
