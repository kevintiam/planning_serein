/** Route HTTP mince : validation et délégation au service métier. */
import { route, requireUser, readBody } from '../../../server/http.js';
import { planningService } from '../../../server/planning-service.js';
import { z } from 'zod';
import { dateSchema, timeSchema } from '../../../domain/validation.js';
const schema = z
  .object({ day: dateSchema, start: timeSchema, end: timeSchema })
  .refine((value) => value.end > value.start, { message: 'Horaire invalide.' });
export const GET = route(async (request) => {
  const user = await requireUser(true);
  const input = schema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return { members: await planningService.available(user, input) };
});
