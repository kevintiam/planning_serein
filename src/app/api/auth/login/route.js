/**
 * @module api/auth/login
 * @description POST /api/auth/login — connexion par courriel + mot de passe.
 *
 * 1. Valide le courriel et le mot de passe.
 * 2. Limite à 10 tentatives par courriel toutes les 15 minutes.
 * 3. Cherche l'utilisateur et compare le mot de passe avec bcrypt.
 * 4. Crée une session et pose le cookie httpOnly.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { COOKIE_NAME, cookieOptions, createSession, isRateLimited } from '@/lib/auth.js';
import { verifyPassword, getDummyHash } from '@/lib/crypto.js';
import { isValidEmail, cleanText } from '@/lib/validation.js';

/**
 * @param {Request} request - corps JSON { email, password }
 * @returns {Promise<NextResponse>} { user } + cookie de session, ou { error }.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const email = cleanText(body?.email).toLowerCase();
    const password = typeof body?.password === 'string' ? body.password : '';

    // Étape 1 : validation
    if (!isValidEmail(email) || !password) {
      return NextResponse.json({ error: 'Courriel ou mot de passe invalide.' }, { status: 400 });
    }

    // Étape 2 : limite de tentatives
    if (await isRateLimited('login:' + email, 10)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });
    }

    // Étape 3 : utilisateur + mot de passe (comparaison factice si le courriel est inconnu)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { team: { select: { name: true } } },
    });
    const passwordOk = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));

    if (!user || !passwordOk) {
      // Message générique : on ne dit pas si c'est le courriel ou le mot de passe qui est faux.
      return NextResponse.json({ error: 'Courriel ou mot de passe incorrect.' }, { status: 401 });
    }

    // Étape 4 : session + cookie
    const token = await createSession(user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        team_id: user.team_id,
        team_name: user.team.name,
      },
    });
    response.cookies.set(COOKIE_NAME, token, cookieOptions());
    return response;
  } catch (error) {
    console.error('Erreur lors de la connexion :', error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
