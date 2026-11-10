/**
 * @module api/invitation
 * @description POST /api/invitation (admin) — génère un nouveau code d'invitation et invalide l'ancien.
 * Seule l'empreinte est stockée (Team.invite_hash) : le code en clair n'est renvoyé qu'ici.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireUser } from '@/lib/auth.js';
import { sha256, randomToken } from '@/lib/crypto.js';

/**
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<NextResponse>} { invitation } ou { error }.
 */
export async function POST(request) {
  try {
    const { user, error } = await requireUser(request, 'admin');
    if (error) return error;

    const invitation = randomToken();
    await prisma.team.update({ where: { id: user.team_id }, data: { invite_hash: sha256(invitation) } });

    return NextResponse.json({ invitation }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error("Erreur lors de la génération de l'invitation :", error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
