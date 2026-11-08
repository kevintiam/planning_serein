'use client';
/** Repli lisible si une page serveur échoue, sans exposer les détails techniques. */
export default function ErrorPage({ reset }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Une erreur est survenue.</h1>
        <p>Vérifiez la configuration de la base de données ou réessayez.</p>
        <button onClick={reset}>Réessayer</button>
      </section>
    </main>
  );
}
