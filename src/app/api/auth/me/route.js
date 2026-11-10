/**
 * @module api/auth/me
 * @description GET /api/auth/me — renvoie l'utilisateur connecté, ou 401.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth.js';

/**
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<NextResponse>} { user: { id, team_id, name, email, role, team_name } }
 */
export async function GET(request) {
  try {
    const { user, error } = await requireUser(request);
    if (error) return error;
    return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Erreur lors de la lecture de la session :', error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
