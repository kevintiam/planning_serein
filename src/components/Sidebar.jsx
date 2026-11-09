/** Barre latérale : marque, équipe, navigation par onglets et profil. Aucune logique métier. */
import { initials } from '../domain/format.js';
// Tracés SVG des icônes d'onglets, indexés par identifiant d'onglet.
const ICONS = {
  planning: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  equipe:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  disponibilites: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
};
/** Icône d'un onglet de navigation. */
function NavIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}
/**
 * @param tabs liste [identifiant, libellé] des onglets
 * @param tab onglet actif
 * @param onTab appelé avec l'identifiant de l'onglet cliqué
 * @param onSignOut déconnexion
 * @param signOutDisabled désactive le bouton pendant une action en cours
 */
export default function Sidebar({ user, admin, tabs, tab, onTab, onSignOut, signOutDisabled }) {
  return (
    <aside className="sidebar">
      <a href="/espace" className="brand">
        <i className="brand-mark" aria-hidden="true" />
        planning<span>serein</span>
      </a>
      <div className="team-title">
        {user.team_name}
        <small>{admin ? 'Espace administrateur' : 'Espace participant'}</small>
      </div>
      <p className="nav-label">ORGANISATION</p>
      <nav>
        {tabs.map(([value, label]) => (
          <button
            key={value}
            className={tab === value ? 'active' : ''}
            /* Indique l'onglet actif aux lecteurs d'écran. */
            aria-current={tab === value ? 'page' : undefined}
            onClick={() => onTab(value)}
          >
            <NavIcon name={value} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <b>
          Moins d’organisation.
          <br />
          Plus de sérénité.
        </b>
        <p>Les disponibilités de chacun, un planning pour tous.</p>
      </div>
      <div className="profile">
        <i className="avatar" aria-hidden="true">
          {initials(user.name)}
        </i>
        <b>{user.name}</b>
        <small>{user.email}</small>
        <button onClick={onSignOut} disabled={signOutDisabled}>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
