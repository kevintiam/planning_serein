/** Vue administrative des membres et de leur déclaration mensuelle. */
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
            const declaration = data.declarations.find((row) => row.user_id === member.id);
            const days = data.absences
              .filter((row) => row.user_id === member.id)
              .map((row) => Number(row.day.slice(-2)));
            return (
              <tr key={member.id}>
                <td>
                  <b>{member.name}</b>
                  <small>{member.email}</small>
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
      {!data.members.length && (
        <div className="empty">
          <h3>Invitez votre premier participant</h3>
          <p>Générez un code d’invitation et transmettez-le avec le lien de la page d’inscription.</p>
        </div>
      )}
    </div>
  );
}
