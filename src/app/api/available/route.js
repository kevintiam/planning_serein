/** GET /api/available?day&start&end (admin) : participants libres sur un créneau et raisons des exclusions. */
import { route, requireUser } from '../../../server/http.js';
import { planningService } from '../../../server/planning-service.js';
import { z } from 'zod';
import { dateSchema, timeSchema } from '../../../domain/validation.js';
// Paramètres de l'URL : une date réelle et une fin strictement après le début.
const schema = z
  .object({ day: dateSchema, start: timeSchema, end: timeSchema })
  .refine((value) => value.end > value.start, { message: 'Horaire invalide.' });
export const GET = route(async (request) => {
  const user = await requireUser(true);
  const input = schema.parse(Object.fromEntries(new URL(request.url).searchParams));
  // Les deux requêtes partent en parallèle.
  const [members, summary] = await Promise.all([
    planningService.available(user, input),
    planningService.availabilitySummary(user, input),
  ]);
  return { members, summary };
});
