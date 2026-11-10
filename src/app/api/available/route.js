/**
 * @module api/available
 * @description GET /api/available?day=AAAA-MM-JJ&start=HH:MM&end=HH:MM (admin)
 * - members : participants libres sur le créneau { id, name }.
 * - summary : { total, notValidated, absent, busy } pour expliquer une liste vide.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireUser } from '@/lib/auth.js';
import { isValidDate, isValidTime } from '@/lib/validation.js';
import { asDate, availableWhere } from '@/lib/planning.js';

/**
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<NextResponse>} { members, summary } ou { error }.
 */
export async function GET(request) {
  try {
    const { user, error } = await requireUser(request, 'admin');
    if (error) return error;

    // Paramètres du créneau
    const params = new URL(request.url).searchParams;
    const slot = { day: params.get('day'), start: params.get('start'), end: params.get('end') };
    if (
      !isValidDate(slot.day) ||
      !isValidTime(slot.start) ||
      !isValidTime(slot.end) ||
      slot.end <= slot.start
    ) {
      return NextResponse.json({ error: 'Horaire invalide.' }, { status: 400 });
    }

    // Requêtes en parallèle
    const month = slot.day.slice(0, 7);
    const team = { team_id: user.team_id, role: 'participant' };
    const validated = { ...team, declarations: { some: { month, confirmed_at: { not: null } } } };

    const [members, total, confirmed, absent] = await Promise.all([
      prisma.user.findMany({
        where: availableWhere(user.team_id, slot),
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.user.count({ where: team }),
      prisma.user.count({ where: validated }),
      prisma.user.count({ where: { ...validated, absences: { some: { day: asDate(slot.day) } } } }),
    ]);

    return NextResponse.json(
      {
        members,
        summary: {
          total,
          notValidated: total - confirmed,
          absent,
          busy: confirmed - absent - members.length,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Erreur lors de la recherche de disponibilités :', error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
