/** /api/tasks (admin) : POST attribue une tâche, DELETE la retire. */
import { route, requireUser, readBody } from '../../../server/http.js';
import { planningService } from '../../../server/planning-service.js';
import { z } from 'zod';
import { taskSchema } from '../../../domain/validation.js';
export const POST = route(async (request) => {
  const user = await requireUser(true);
  return planningService.createTask(user, await readBody(request, taskSchema));
});
export const DELETE = route(async (request) => {
  const user = await requireUser(true);
  const { id } = await readBody(request, z.object({ id: z.string().uuid() }));
  return planningService.deleteTask(user, id);
});
