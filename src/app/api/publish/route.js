/** Route HTTP mince : validation et délégation au service métier. */
import { route, requireUser, readBody } from '../../../server/http.js';
import { planningService } from '../../../server/planning-service.js';
import { z } from 'zod';
import { monthSchema } from '../../../domain/validation.js';
export const POST = route(async (request) => {
  const user = await requireUser(true);
  const { month } = await readBody(request, z.object({ month: monthSchema }));
  return planningService.publish(user, month);
});
