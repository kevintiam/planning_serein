/** Page absente : lien de retour vers l'espace de connexion. */
import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Page introuvable.</h1>
        <Link href="/">Retour à l’accueil</Link>
      </section>
    </main>
  );
}
