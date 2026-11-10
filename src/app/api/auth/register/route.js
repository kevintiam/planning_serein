/**
 * @module api/auth/register
 * @description POST /api/auth/register — inscription d'un participant avec un code d'invitation.
 *
 * 1. Valide le nom, le courriel, le mot de passe et le code.
 * 2. Limite à 5 essais par courriel et 30 par code, toutes les 15 minutes.
 * 3. Retrouve l'équipe grâce à l'empreinte du code (Team.invite_hash).
 * 4. Crée le compte (role « participant ») et sa session dans une même transaction.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { COOKIE_NAME, cookieOptions, createSession, isRateLimited } from '@/lib/auth.js';
import { sha256, hashPassword } from '@/lib/crypto.js';
import { isValidEmail, isValidPassword, isValidText, cleanText } from '@/lib/validation.js';

/**
 * @param {Request} request - corps JSON { name, email, password, invitation }
 * @returns {Promise<NextResponse>} { registered: true } + cookie, ou { error }.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const name = cleanText(body?.name);
    const email = cleanText(body?.email).toLowerCase();
    const password = body?.password;
    const invitation = cleanText(body?.invitation);

    // Étape 1 : validation
    if (!isValidText(name, 2, 100)) {
      return NextResponse.json({ error: 'Le nom doit contenir de 2 à 100 caractères.' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Utilisez votre courriel @lacitec.on.ca.' }, { status: 400 });
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: 'Utilisez au moins 12 caractères.' }, { status: 400 });
    }
    if (!isValidText(invitation, 20, 128)) {
      return NextResponse.json({ error: 'Code d’invitation invalide.' }, { status: 400 });
    }

    // Étape 2 : limites de tentatives
    if (
      (await isRateLimited('register:' + email, 5)) ||
      (await isRateLimited('invitation:' + invitation, 30))
    ) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });
    }

    // Étape 3 : équipe du code (on compare des empreintes, jamais le code en clair)
    const team = await prisma.team.findUnique({
      where: { invite_hash: sha256(invitation) },
      select: { id: true },
    });
    if (!team) {
      return NextResponse.json({ error: 'Code d’invitation invalide.' }, { status: 400 });
    }

    // Étape 4 : compte + session ensemble ; si l'un échoue, rien n'est enregistré
    const password_hash = await hashPassword(password);
    let token;
    try {
      token = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { team_id: team.id, name, email, password_hash, role: 'participant' },
          select: { id: true },
        });
        return createSession(user.id, tx);
      });
    } catch (error) {
      // P2002 = courriel déjà utilisé. Message vague pour ne pas révéler les comptes existants.
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Inscription impossible avec cette adresse. Essayez de vous connecter.' },
          { status: 409 },
        );
      }
      throw error;
    }

    const response = NextResponse.json({ registered: true }, { status: 201 });
    response.cookies.set(COOKIE_NAME, token, cookieOptions());
    return response;
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error.code || error.name);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
