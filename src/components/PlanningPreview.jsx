/** Aperçu décoratif : aucune donnée personnelle ou disponibilité réelle. */
/**
 * Colonne de présentation des pages publiques, avec un faux calendrier décoratif
 * (masqué aux lecteurs d'écran par aria-hidden).
 */
export default function PlanningPreview() {
  const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  // Les jours 1 à 31 du faux mois affiché.
  const NOMBRES = Array.from({ length: 31 }, (_, index) => index + 1);
  return (
    <aside className="welcome-story" aria-label="Un planning pensé pour votre équipe">
      <span className="story-tag">
        <span /> L’organisation, l’esprit léger
      </span>
      <h2>
        De la place pour chacun.
        <br />
        <em>Du temps pour l’essentiel.</em>
      </h2>
      <p>Rassemblez les disponibilités, trouvez le bon équilibre et avancez ensemble. Tout simplement.</p>
      <div className="preview-card" aria-hidden="true">
        <div className="preview-top">
          <span>Votre mois prend forme</span>
          <span className="preview-dots">•••</span>
        </div>
        <div className="preview-month">Un bel équilibre </div>
        <div className="preview-week">
          {JOURS.map((day, index) => (
            <span key={index}>{day}</span>
          ))}
        </div>
        <div className="preview-days">
          {NOMBRES.map((number) => (
            <span
              /* Quelques jours en vert (tâches) et le 13 en terracotta (indisponible), pour illustrer. */
              className={
                [2, 3, 9, 17, 26].includes(number) ? 'preview-filled' : number === 13 ? 'preview-peach' : ''
              }
              key={number}
            >
              {number}
            </span>
          ))}
        </div>
        <div className="preview-bottom">
          <div className="preview-avatars">
            <i>A</i>
            <i>M</i>
            <i>L</i>
          </div>
          <span>Chacun trouve sa place.</span>
          <b>✓</b>
        </div>
      </div>
      <div className="story-footnote">
        <span>01 — Disponibilités</span>
        <span>02 — Équilibre</span>
        <span>03 — Sérénité</span>
      </div>
    </aside>
  );
}
