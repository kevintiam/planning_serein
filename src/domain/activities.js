/**
 * Liste fixe des activités proposées dans « Attribuer une tâche ».
 * Utilisée par la liste déroulante (TaskDialog) ET par le backend (/api/tasks),
 * qui refuse toute activité absente de cette liste.
 *
 * Pour ajouter, retirer ou renommer une activité : modifier ce tableau puis redéployer.
 * (Les tâches déjà créées gardent leur ancien intitulé.)
 */
export const ACTIVITIES = ['Stories', 'Photo', 'Selection', 'Creation', 'Redaction', 'Vignette', 'Citation', 'Video Invitation', 'Validation', 'Publication'];
