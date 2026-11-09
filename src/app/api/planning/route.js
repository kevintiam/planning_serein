/** GET /api/planning?month=AAAA-MM : données du mois (filtrées selon le rôle par le service). */
import { route, requireUser } from '../../../server/http.js';
import { planningService } from '../../../server/planning-service.js';
import { monthSchema } from '../../../domain/validation.js';
export const GET = route(async (request) => {
  const user = await requireUser();
  const month = monthSchema.parse(new URL(request.url).searchParams.get('month'));
  return planningService.overview(user, month);
});
