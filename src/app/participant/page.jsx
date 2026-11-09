/** Espace participant (/participant) : la session et le rôle sont vérifiés côté serveur avant l'affichage. */
import { pageUser } from '../../server/page-access.js';
import Workspace from '../../components/Workspace.jsx';
// Toujours rendue à la demande : la page dépend du cookie de session.
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await pageUser('participant');
  return <Workspace user={user} />;
}
