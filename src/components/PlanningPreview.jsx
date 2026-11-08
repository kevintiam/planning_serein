/** Aperçu décoratif : aucune donnée personnelle ou disponibilité réelle. */
export default function PlanningPreview() {
  return (
    <aside className="welcome-story" aria-label="Un planning pensé pour votre équipe">
      <span className="story-tag"><span /> L’organisation, l’esprit léger</span>
      <h2>De la place pour chacun.<br /><em>Du temps pour l’essentiel.</em></h2>
      <p>Rassemblez les disponibilités, trouvez le bon équilibre et avancez ensemble. Tout simplement.</p>
      <div className="preview-card" aria-hidden="true">
        <div className="preview-top"><span>Votre mois prend forme</span><span className="preview-dots">•••</span></div>
        <div className="preview-month">Un bel équilibre <span>↗</span></div>
        <div className="preview-week">{'L M M J V S D'.split(' ').map((day, index) => <span key={index}>{day}</span>)}</div>
        <div className="preview-days">{Array.from({ length: 21 }, (_, index) => <span className={[2, 3, 9, 17].includes(index) ? 'preview-filled' : index === 12 ? 'preview-peach' : ''} key={index}>{index + 1}</span>)}</div>
        <div className="preview-bottom"><div className="preview-avatars"><i>A</i><i>M</i><i>L</i></div><span>Chacun trouve sa place.</span><b>✓</b></div>
      </div>
      <div className="story-footnote"><span>01 — Disponibilités</span><span>02 — Équilibre</span><span>03 — Sérénité</span></div>
    </aside>
  );
}
