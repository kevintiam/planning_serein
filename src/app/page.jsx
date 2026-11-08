/** Entrée publique : la connexion est indépendante de ChatGPT. */
import Link from 'next/link';
import PlanningPreview from '../components/PlanningPreview.jsx';
export default function Home() {
  return (
    <main className="auth-page">
      <PlanningPreview />
      <section className="auth-card">
        <div className="brand">
          ◌ planning<span>serein</span>
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
