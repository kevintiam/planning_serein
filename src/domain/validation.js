/** Validation partagée ; aucune dépendance serveur, utilisable dans les tests. */
import { z } from 'zod';
export const monthSchema = z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);
export const dateSchema = z
  .string()
  .regex(/^20\d{2}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Date inexistante.');
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(12, 'Utilisez au moins 12 caractères.').max(128);
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
  invitation: z.string().trim().min(20).max(128),
});
export const loginSchema = z.object({ email: emailSchema, password: passwordSchema });
export const declarationSchema = z
  .object({
    month: monthSchema,
    days: z.array(dateSchema).max(31),
    confirm: z.boolean(),
  })
  .refine((body) => body.days.every((day) => day.startsWith(`${body.month}-`)), {
    message: 'Toutes les dates doivent appartenir au mois choisi.',
  });
export const taskSchema = z
  .object({
    participantId: z.string().uuid(),
    day: dateSchema,
    start: timeSchema,
    end: timeSchema,
    title: z.string().trim().min(2).max(100),
  })
  .refine((body) => body.end > body.start, { message: 'La fin doit suivre le début, le même jour.' });
