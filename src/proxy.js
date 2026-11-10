/**
 * Proxy Next.js (anciennement « middleware ») : s'exécute avant toutes les routes /api.
 *
 * Protection CSRF : une requête qui modifie des données (POST, PUT, DELETE…) doit venir
 * de notre propre site. L'en-tête Origin, ajouté par le navigateur, doit donc être égal à APP_URL.
 */
import { NextResponse } from 'next/server';

export function proxy(request) {
  // Les lectures (GET, HEAD) ne modifient rien : elles passent.
  if (['GET', 'HEAD'].includes(request.method)) return NextResponse.next();

  const appUrl = process.env.APP_URL;
  if (!appUrl || request.headers.get('origin') !== new URL(appUrl).origin) {
    return NextResponse.json({ error: 'Origine de la requête refusée.' }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
