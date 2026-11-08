/** Redirection déterminée par le rôle stocké en base, jamais par le client. */
import { redirect } from 'next/navigation';
import { pageUser } from '../../server/page-access.js';
export default async function Page() {
  const user = await pageUser();
  redirect(user.role === 'admin' ? '/admin' : '/participant');
}
