/**
 * Proxy Next.js (anciennement « middleware ») : s'exécute avant toutes les routes /api.
 *
 * Protection CSRF : une requête qui modifie des données (POST, PUT, DELETE…) doit venir
 * de notre propre site. L'en-tête Origin, ajouté par le navigateur, doit donc être :
 * - l'adresse sur laquelle le site est servi (fonctionne sur toutes les URL Vercel :
 *   production, prévisualisations, domaine personnalisé) ;
 * - ou APP_URL, si elle est définie.
 */
import { NextResponse } from 'next/server';

export function proxy(request) {
  // Les lectures (GET, HEAD) ne modifient rien : elles passent.
  if (['GET', 'HEAD'].includes(request.method)) return NextResponse.next();

  const origin = request.headers.get('origin');
  const allowed = [request.nextUrl.origin];
  if (process.env.APP_URL) allowed.push(new URL(process.env.APP_URL).origin);

  if (!origin || !allowed.includes(origin)) {
    return NextResponse.json({ error: 'Origine de la requête refusée.' }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
