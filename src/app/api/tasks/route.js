/**
 * @module api/tasks
 * @description (admin) Attribution et retrait des tâches.
 *
 * POST   /api/tasks — corps { participantId, day, start, end, title } → { id }
 * DELETE /api/tasks — corps { id } → { deleted: true }
 * Toute modification repasse le planning du mois en brouillon.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireUser } from '@/lib/auth.js';
import { isValidDate, isValidTime, isValidUuid, isValidText, cleanText } from '@/lib/validation.js';
import { asDate, asTime, dayText, availableWhere, markDraft, lockMonth } from '@/lib/planning.js';

/**
 * POST : attribue une tâche. La disponibilité est revérifiée sous verrou,
 * car l'état a pu changer depuis l'ouverture de la fenêtre.
 */
export async function POST(request) {
  try {
    const { user, error } = await requireUser(request, 'admin');
    if (error) return error;

    // Validation du corps
    const body = await request.json().catch(() => null);
    const title = cleanText(body?.title);
    if (
      !isValidUuid(body?.participantId) ||
      !isValidDate(body?.day) ||
      !isValidTime(body?.start) ||
      !isValidTime(body?.end)
    ) {
      return NextResponse.json({ error: 'Données de la tâche invalides.' }, { status: 400 });
    }
    if (body.end <= body.start) {
      return NextResponse.json({ error: 'La fin doit suivre le début, le même jour.' }, { status: 400 });
    }
    if (!isValidText(title, 2, 100)) {
      return NextResponse.json({ error: 'Le titre doit contenir de 2 à 100 caractères.' }, { status: 400 });
    }

    const month = body.day.slice(0, 7);
    const task = await prisma.$transaction(async (tx) => {
      await lockMonth(tx, user.team_id, month);

      // Le participant doit toujours être libre sur ce créneau.
      const person = await tx.user.findFirst({
        where: { id: body.participantId, ...availableWhere(user.team_id, body) },
        select: { id: true },
      });
      if (!person) return null;

      const created = await tx.task.create({
        data: {
          team_id: user.team_id,
          participant_id: body.participantId,
          day: asDate(body.day),
          start_time: asTime(body.start),
          end_time: asTime(body.end),
          title,
        },
        select: { id: true },
      });
      await markDraft(tx, user.team_id, month);
      return created;
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Participant indisponible, occupé ou déclaration non validée.' },
        { status: 409 },
      );
    }
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'attribution de la tâche :", error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** DELETE : retire une tâche de l'équipe. */
export async function DELETE(request) {
  try {
    const { user, error } = await requireUser(request, 'admin');
    if (error) return error;

    const body = await request.json().catch(() => null);
    if (!isValidUuid(body?.id)) {
      return NextResponse.json({ error: 'Identifiant de tâche invalide.' }, { status: 400 });
    }

    const deleted = await prisma.$transaction(async (tx) => {
      // On cherche la tâche dans l'équipe de l'admin uniquement.
      const task = await tx.task.findFirst({
        where: { id: body.id, team_id: user.team_id },
        select: { day: true },
      });
      if (!task) return false;

      const month = dayText(task.day).slice(0, 7);
      await lockMonth(tx, user.team_id, month);
      await tx.task.deleteMany({ where: { id: body.id, team_id: user.team_id } });
      await markDraft(tx, user.team_id, month);
      return true;
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche :', error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
