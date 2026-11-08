/** Page protégée et rôle vérifié côté serveur avant affichage. */
import { pageUser } from '../../server/page-access.js';
import Workspace from '../../components/Workspace.jsx';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await pageUser('participant');
  return <Workspace user={user} />;
}
