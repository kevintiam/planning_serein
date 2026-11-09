'use client';
/** Assemblage des vues. Les appels API restent dans les hooks et src/api. */
import { useWorkspace } from '../hooks/useWorkspace.js';
import Feedback from './Feedback.jsx';
import MonthBar from './MonthBar.jsx';
import AvailabilityCalendar from './AvailabilityCalendar.jsx';
import PlanningCalendar from './PlanningCalendar.jsx';
import { dailyAvailability } from '../domain/calendar.js';
import TeamTable from './TeamTable.jsx';
import TaskDialog from './TaskDialog.jsx';
import Sidebar from './Sidebar.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

/**
 * Espace connecté (admin ou participant) : barre latérale, en-tête, indicateurs,
 * calendrier ou tableau selon l'onglet, et fenêtres (tâche, code d'invitation).
 * @param user utilisateur fourni par la page serveur (vérifié côté serveur)
 */
export default function Workspace({ user }) {
  const model = useWorkspace(user);
  const { data, month, tab, setTab, busy, loading } = model;
  const admin = user.role === 'admin';
  // Onglets [identifiant, libellé] selon le rôle.
  const tabs = admin
    ? [
        ['planning', 'Planning mensuel'],
        ['equipe', 'Mon équipe'],
      ]
    : [
        ['disponibilites', 'Mes disponibilités'],
        ['planning', 'Mes tâches'],
      ];
  // true si au moins une tâche est en conflit (la publication est alors bloquée).
  const conflicts = data?.tasks.some((task) => task.conflict);
  // Nombre de personnes disponibles par jour, affiché dans chaque case (admin seulement).
  const availability =
    admin && data ? dailyAvailability(month, data.members, data.declarations, data.absences) : {};

  return (
    <div className="workspace">
      <Sidebar
        user={user}
        admin={admin}
        tabs={tabs}
        tab={tab}
        onTab={setTab}
        onSignOut={model.signOut}
        signOutDisabled={busy || model.declaration.busy}
      />
      <main className="main-area">
        {/* Fil d'Ariane : équipe / onglet actif, et badge du rôle. */}
        <header>
          <span>
            {user.team_name} / {tabs.find(([key]) => key === tab)?.[1]}
          </span>
          <span className="badge green">{admin ? 'Administrateur' : 'Participant'}</span>
        </header>
        <div className="content">
          {/* Titre de la page, adapté à l’onglet. */}
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
              <button className="primary" onClick={model.askInvite} disabled={busy}>
                Générer un code d’invitation
              </button>
            )}
          </div>
          <Feedback error={model.error} message={model.message} />
          {/* Nouveau code : affiché une seule fois, sélectionné au focus pour faciliter la copie. */}
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
          {/* Trois indicateurs du mois, différents pour l’admin et le participant. */}
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
          {/* Panneau principal : navigation entre les mois, puis contenu de l’onglet. */}
          <section className="panel">
            <MonthBar
              month={month}
              onMove={model.changeMonth}
              disabled={busy || model.declaration.busy || loading}
            >
              {/* Publication impossible sans tâche, déjà publiée, ou avec des conflits. */}
              {admin && tab === 'planning' && (
                <button
                  className="primary"
                  onClick={model.publish}
                  disabled={busy || loading || !data?.tasks.length || data?.published || conflicts}
                >
                  Publier le planning du mois
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
                  availability={availability}
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
      {/* Fenêtre de confirmation avant de remplacer le code d'invitation. */}
      {model.inviteAsked && (
        <ConfirmDialog
          title="Générer un nouveau code ?"
          confirmLabel="Générer le code"
          onConfirm={model.confirmInvite}
          onCancel={model.cancelInvite}
          busy={busy}
        >
          <p>Un nouveau code sera créé pour votre équipe.</p>
          <p>
            <b>L’ancien code ne fonctionnera plus</b> pour les nouvelles inscriptions. Les membres déjà
            inscrits gardent leur compte.
          </p>
        </ConfirmDialog>
      )}
      {/* Fenêtre « Attribuer une tâche », ouverte en cliquant sur une case du calendrier. */}
      {model.taskDay && (
        <TaskDialog day={model.taskDay} onClose={() => model.setTaskDay('')} onSaved={model.taskSaved} />
      )}
    </div>
  );
}
