/**
 * @module api/planning
 * @description Données d'un mois pour l'écran principal.
 *
 * GET /api/planning?month=AAAA-MM
 * - L'admin voit toute l'équipe : participants, déclarations, absences et tâches.
 * - Un participant ne voit que ses propres données, et ses tâches seulement
 *   une fois le planning publié.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireUser } from '@/lib/auth.js';
import { isValidMonth } from '@/lib/validation.js';
import { monthRange, dayText, timeText, participantFacts, taskConflict } from '@/lib/planning.js';

/**
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<NextResponse>} { month, published, members, declarations, absences, tasks }
 */
export async function GET(request) {
  try {
    // Étape 1 : utilisateur connecté (et rôle exigé)
    const { user, error } = await requireUser(request);
    if (error) return error;

    // Étape 2 : mois demandé
    const month = new URL(request.url).searchParams.get('month');
    if (!isValidMonth(month)) {
      return NextResponse.json({ error: 'Mois invalide.' }, { status: 400 });
    }

    const team_id = user.team_id;
    const isAdmin = user.role === 'admin';
    // Un participant ne lit que ses propres lignes.
    const owned = isAdmin ? {} : { user_id: user.id };

    // Étape 3 : état de publication du mois
    const schedule = await prisma.schedule.findUnique({ where: { team_id_month: { team_id, month } } });
    const published = Boolean(schedule?.published_at);

    // Étape 4 : lecture des données
    const members = isAdmin
      ? await prisma.user.findMany({
          where: { team_id, role: 'participant' },
          select: { id: true, name: true, email: true, role: true },
          orderBy: { name: 'asc' },
        })
      : [];

    const declarations = await prisma.declaration.findMany({
      where: { team_id, month, ...owned },
      select: { user_id: true, confirmed_at: true, updated_at: true },
    });

    const absences = await prisma.absence.findMany({
      where: { team_id, day: monthRange(month), ...owned },
      select: { user_id: true, day: true },
      orderBy: { day: 'asc' },
    });

    const tasks =
      isAdmin || published
        ? await prisma.task.findMany({
            where: { team_id, day: monthRange(month), ...(isAdmin ? {} : { participant_id: user.id }) },
            include: { participant: participantFacts(month) },
            orderBy: [{ day: 'asc' }, { start_time: 'asc' }],
          })
        : [];

    // Étape 5 : réponse (dates et heures converties en texte pour le frontend)
    return NextResponse.json(
      {
        month,
        published,
        members,
        declarations,
        absences: absences.map((a) => ({ ...a, day: dayText(a.day) })),
        tasks: tasks.map((t) => ({
          id: t.id,
          participant_id: t.participant_id,
          day: dayText(t.day),
          start: timeText(t.start_time),
          end: timeText(t.end_time),
          title: t.title,
          name: t.participant.name,
          conflict: taskConflict(t, month),
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Erreur lors de la lecture du planning :', error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
