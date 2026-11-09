/** Validation partagée ; aucune dépendance serveur, utilisable dans les tests. */
import { z } from 'zod';
/** Mois « AAAA-MM » entre 2000 et 2099. */
export const monthSchema = z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);
/** Date « AAAA-MM-JJ » qui existe vraiment (refuse par exemple le 31 février). */
export const dateSchema = z
  .string()
  .regex(/^20\d{2}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Date inexistante.');
/** Heure « HH:MM » sur 24 heures. */
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
/** Courriel normalisé : espaces retirés et mis en minuscules. */
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(12, 'Utilisez au moins 12 caractères.').max(128);
/** Corps attendu à l'inscription. */
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
  invitation: z.string().trim().min(20).max(128),
});
/** Corps attendu à la connexion. */
export const loginSchema = z.object({ email: emailSchema, password: passwordSchema });
/** Déclaration d'absences : toutes les dates doivent appartenir au mois indiqué. */
export const declarationSchema = z
  .object({
    month: monthSchema,
    days: z.array(dateSchema).max(31),
    confirm: z.boolean(),
  })
  .refine((body) => body.days.every((day) => day.startsWith(`${body.month}-`)), {
    message: 'Toutes les dates doivent appartenir au mois choisi.',
  });
/** Tâche à attribuer : la fin doit être après le début, le même jour. */
export const taskSchema = z
  .object({
    participantId: z.string().uuid(),
    day: dateSchema,
    start: timeSchema,
    end: timeSchema,
    title: z.string().trim().min(2).max(100),
  })
  .refine((body) => body.end > body.start, { message: 'La fin doit suivre le début, le même jour.' });
