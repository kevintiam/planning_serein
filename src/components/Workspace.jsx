'use client';
/** Assemblage des vues. Les appels API restent dans les hooks et src/api. */
import { useWorkspace } from '../hooks/useWorkspace.js';
import Feedback from './Feedback.jsx';
import MonthBar from './MonthBar.jsx';
import AvailabilityCalendar from './AvailabilityCalendar.jsx';
import PlanningCalendar from './PlanningCalendar.jsx';
import TeamTable from './TeamTable.jsx';
import TaskDialog from './TaskDialog.jsx';
export default function Workspace({ user }) {
  const model = useWorkspace(user);
  const { data, month, tab, setTab, busy, loading } = model;
  const admin = user.role === 'admin';
  const tabs = admin
    ? [
        ['planning', 'Planning mensuel'],
        ['equipe', 'Mon équipe'],
      ]
    : [
        ['disponibilites', 'Mes disponibilités'],
        ['planning', 'Mes tâches'],
      ];
  const conflicts = data?.tasks.some((task) => task.conflict);
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a href="/espace" className="brand">
          ◌ planning<span>serein</span>
        </a>
        <div className="team-title">
          {user.team_name}
          <small>{admin ? 'Espace administrateur' : 'Espace participant'}</small>
        </div>
        <p className="nav-label">ORGANISATION</p>
        <nav>
          {tabs.map(([value, label]) => (
            <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>
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
          <b>{user.name}</b>
          <small>{user.email}</small>
          <button onClick={model.signOut} disabled={busy || model.declaration.busy}>
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header>
          <span>
            {user.team_name} / {tabs.find(([key]) => key === tab)?.[1]}
          </span>
          <span className="badge green">{admin ? 'Administrateur' : 'Participant'}</span>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">L’ÉQUIPE, EN HARMONIE</p>
              <h1>
                {tab === 'disponibilites'
                  ? 'À chacun ses disponibilités.'
                  : tab === 'equipe'
                    ? 'Votre équipe, réunie.'
                    : 'Un mois bien organisé.'}
              </h1>
              <p>
                {admin
                  ? 'Construisez le planning à partir des disponibilités validées.'
                  : 'Un espace personnel, simple et utile.'}
              </p>
            </div>
            {admin && tab === 'equipe' && (
              <button className="primary" onClick={model.invite} disabled={busy}>
                Générer un code d’invitation
              </button>
            )}
          </div>
          <Feedback error={model.error} message={model.message} />
          {model.invitation && (
            <div className="invitation">
              <b>Code d’invitation — à copier maintenant</b>
              <input
                readOnly
                value={model.invitation}
                aria-label="Code d’invitation"
                onFocus={(event) => event.target.select()}
              />
              <small>
                Transmettez ce code et l’adresse de la page /inscription aux membres de votre équipe. L’ancien
                code a été remplacé.
              </small>
            </div>
          )}
          {data && (
            <div className="stats">
              <article>
                <span>{admin ? 'Participants' : 'Mes indisponibilités'}</span>
                <strong>{admin ? data.members.length : data.absences.length}</strong>
              </article>
              <article>
                <span>{admin ? 'Déclarations validées' : 'Mes tâches publiées'}</span>
                <strong>
                  {admin ? data.declarations.filter((row) => row.confirmed_at).length : data.tasks.length}
                </strong>
              </article>
              <article>
                <span>Planning du mois</span>
                <strong className="status-text">{data.published ? 'Publié' : 'Brouillon'}</strong>
              </article>
            </div>
          )}
          <section className="panel">
            <MonthBar
              month={month}
              onMove={model.changeMonth}
              disabled={busy || model.declaration.busy || loading}
            >
              {admin && tab === 'planning' && (
                <button
                  className="primary"
                  onClick={model.publish}
                  disabled={busy || loading || !data?.tasks.length || data?.published || conflicts}
                >
                  Publier le mois
                </button>
              )}
            </MonthBar>
            {loading ? (
              <p className="empty" role="status">
                Chargement du mois…
              </p>
            ) : !data ? (
              <p className="empty">Impossible de charger le planning. Réessayez en rechargeant la page.</p>
            ) : tab === 'disponibilites' ? (
              <AvailabilityCalendar month={month} declaration={model.declaration} />
            ) : tab === 'equipe' ? (
              <TeamTable data={data} />
            ) : (
              <>
                {conflicts && (
                  <p className="notice error">
                    Certaines disponibilités ont changé. Retirez les tâches en conflit puis réattribuez-les.
                  </p>
                )}
                {!admin && !data.published && (
                  <p className="explanation">
                    Le planning est en préparation. Vos tâches apparaîtront après publication.
                  </p>
                )}
                {admin && (
                  <p className="explanation">
                    Cliquez sur une date pour choisir un participant disponible et lui attribuer une tâche.
                  </p>
                )}
                <PlanningCalendar
                  month={month}
                  tasks={data.tasks}
                  admin={admin}
                  onDay={model.setTaskDay}
                  onRemove={model.removeTask}
                  busy={busy}
                />
              </>
            )}
          </section>
          <p className="footer-note">Un planning simple, pour avancer ensemble.</p>
        </div>
      </main>
      {model.taskDay && (
        <TaskDialog day={model.taskDay} onClose={() => model.setTaskDay('')} onSaved={model.taskSaved} />
      )}
    </div>
  );
}
