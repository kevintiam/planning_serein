/** Espace administrateur (/admin) : la session et le rôle sont vérifiés côté serveur avant l'affichage. */
import { pageUser } from '@/lib/auth.js';
import Workspace from '../../components/Workspace.jsx';
// Toujours rendue à la demande : la page dépend du cookie de session.
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await pageUser('admin');
  return <Workspace user={user} />;
}
