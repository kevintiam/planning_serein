/**
 * @module api/auth/logout
 * @description POST /api/auth/logout — supprime la session en base et efface le cookie.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { COOKIE_NAME, cookieOptions } from '@/lib/auth.js';
import { sha256 } from '@/lib/crypto.js';

/**
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<NextResponse>} { loggedOut: true } et cookie effacé.
 */
export async function POST(request) {
  try {
    // deleteMany ne plante pas si la session n'existe plus.
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) await prisma.session.deleteMany({ where: { token_hash: sha256(token) } });

    const response = NextResponse.json({ loggedOut: true });
    response.cookies.set(COOKIE_NAME, '', cookieOptions(0));
    return response;
  } catch (error) {
    console.error('Erreur lors de la déconnexion :', error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
