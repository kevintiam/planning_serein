/**
 * @module api/declarations
 * @description Un participant enregistre ses jours d'absence du mois.
 *
 * PUT /api/declarations — corps { month, days, confirm }
 * - days    : liste de dates « AAAA-MM-JJ » du mois choisi.
 * - confirm : true valide la déclaration ; false la garde en brouillon.
 * Toute modification repasse le planning du mois en brouillon.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireUser } from '@/lib/auth.js';
import { isValidMonth, isValidDate } from '@/lib/validation.js';
import { asDate, monthRange, markDraft, lockMonth } from '@/lib/planning.js';

/**
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<NextResponse>} { saved: true } ou { error }.
 */
export async function PUT(request) {
  try {
    // Étape 1 : utilisateur connecté (et rôle exigé)
    const { user, error } = await requireUser(request, 'participant');
    if (error) return error;

    // Étape 2 : validation du corps
    const body = await request.json().catch(() => null);
    const month = body?.month;
    const days = body?.days;
    if (!isValidMonth(month)) {
      return NextResponse.json({ error: 'Mois invalide.' }, { status: 400 });
    }
    if (!Array.isArray(days) || days.length > 31 || !days.every(isValidDate)) {
      return NextResponse.json({ error: 'Dates invalides.' }, { status: 400 });
    }
    if (!days.every((day) => day.startsWith(`${month}-`))) {
      return NextResponse.json(
        { error: 'Toutes les dates doivent appartenir au mois choisi.' },
        { status: 400 },
      );
    }
    if (typeof body.confirm !== 'boolean') {
      return NextResponse.json({ error: 'Le champ confirm est requis.' }, { status: 400 });
    }

    // Étape 3 : remplacement des absences du mois, dans une transaction verrouillée
    await prisma.$transaction(async (tx) => {
      await lockMonth(tx, user.team_id, month);

      await tx.absence.deleteMany({ where: { user_id: user.id, day: monthRange(month) } });
      const uniques = [...new Set(days)];
      if (uniques.length) {
        await tx.absence.createMany({
          data: uniques.map((day) => ({ user_id: user.id, team_id: user.team_id, day: asDate(day) })),
        });
      }

      const confirmed_at = body.confirm ? new Date() : null;
      await tx.declaration.upsert({
        where: { user_id_month: { user_id: user.id, month } },
        create: { user_id: user.id, team_id: user.team_id, month, confirmed_at },
        update: { confirmed_at, updated_at: new Date() },
      });

      await markDraft(tx, user.team_id, month);
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error('Erreur lors de la déclaration :', error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
