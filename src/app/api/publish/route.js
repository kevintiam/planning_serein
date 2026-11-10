/**
 * @module api/publish
 * @description (admin) Publie le planning du mois : les participants voient alors leurs tâches.
 *
 * POST /api/publish — corps { month }
 * Refusé (409) tant qu'une tâche est en conflit (déclaration dévalidée ou absence ce jour-là).
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireUser } from '@/lib/auth.js';
import { isValidMonth } from '@/lib/validation.js';
import { monthRange, participantFacts, taskConflict, lockMonth } from '@/lib/planning.js';

/**
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<NextResponse>} { published: true } ou { error }.
 */
export async function POST(request) {
  try {
    // Étape 1 : utilisateur connecté (et rôle exigé)
    const { user, error } = await requireUser(request, 'admin');
    if (error) return error;

    // Étape 2 : mois à publier
    const body = await request.json().catch(() => null);
    const month = body?.month;
    if (!isValidMonth(month)) {
      return NextResponse.json({ error: 'Mois invalide.' }, { status: 400 });
    }

    // Étape 3 : vérification des conflits puis publication, sous verrou
    const published = await prisma.$transaction(async (tx) => {
      await lockMonth(tx, user.team_id, month);

      const tasks = await tx.task.findMany({
        where: { team_id: user.team_id, day: monthRange(month) },
        include: { participant: participantFacts(month) },
      });
      if (tasks.some((t) => taskConflict(t, month))) return false;

      const published_at = new Date();
      await tx.schedule.upsert({
        where: { team_id_month: { team_id: user.team_id, month } },
        create: { team_id: user.team_id, month, published_at },
        update: { published_at },
      });
      return true;
    });

    if (!published) {
      return NextResponse.json(
        { error: 'Résolvez les conflits et les déclarations en attente avant de publier.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ published: true });
  } catch (error) {
    console.error('Erreur lors de la publication :', error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
