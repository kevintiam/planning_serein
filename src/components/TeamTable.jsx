/** Vue administrative des membres et de leur déclaration mensuelle. */
import { initials } from '../domain/format.js';
/**
 * Tableau de l'équipe pour le mois affiché.
 * @param data réponse de /api/planning (members, declarations, absences)
 */
export default function TeamTable({ data }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Participant</th>
            <th>Déclaration du mois</th>
            <th>Jours indisponibles</th>
          </tr>
        </thead>
        <tbody>
          {data.members.map((member) => {
            // Déclaration de ce membre pour le mois (undefined s’il n’a rien envoyé).
            const declaration = data.declarations.find((row) => row.user_id === member.id);
            // Ses jours d'absence, réduits au numéro du jour (ex. 3, 4, 17).
            const days = data.absences
              .filter((row) => row.user_id === member.id)
              .map((row) => Number(row.day.slice(-2)));
            return (
              <tr key={member.id}>
                <td>
                  <div className="member">
                    <i className="avatar" aria-hidden="true">
                      {initials(member.name)}
                    </i>
                    <div>
                      <b>{member.name}</b>
                      <small>{member.email}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${declaration?.confirmed_at ? 'green' : 'amber'}`}>
                    {declaration?.confirmed_at ? 'Validée' : declaration ? 'Brouillon' : 'En attente'}
                  </span>
                </td>
                <td>
                  {days.length
                    ? days.join(', ')
                    : declaration?.confirmed_at
                      ? 'Disponible tout le mois'
                      : 'Non confirmé'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Équipe vide : invitation à générer un premier code. */}
      {!data.members.length && (
        <div className="empty">
          <h3>Invitez votre premier participant</h3>
          <p>Générez un code d’invitation et transmettez-le avec le lien de la page d’inscription.</p>
        </div>
      )}
    </div>
  );
}
