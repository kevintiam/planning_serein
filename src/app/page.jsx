/** Page d'accueil publique : présentation de l'app et accès à la connexion ou à l'inscription. */
import Link from 'next/link';
import PlanningPreview from '../components/PlanningPreview.jsx';
export default function Home() {
  return (
    <main className="auth-page">
      <PlanningPreview />
      <section className="auth-card">
        <div className="brand">
          <i className="brand-mark" aria-hidden="true" />
          planning<span>serein</span>
        </div>
        <p className="eyebrow">VOTRE ÉQUIPE, SIMPLEMENT</p>
        <h1>Un mois bien organisé.</h1>
        <p>Indiquez vos indisponibilités. Votre administrateur s’occupe du planning.</p>
        <Link className="primary wide" href="/connexion">
          Me connecter
        </Link>
        <Link className="secondary wide" href="/inscription">
          Créer mon compte participant
        </Link>
        <small>Un code d’invitation est nécessaire pour rejoindre votre équipe.</small>
      </section>
    </main>
  );
}
