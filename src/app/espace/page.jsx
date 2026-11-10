/** Page /espace : redirige vers /admin ou /participant selon le rôle enregistré en base, jamais selon le client. */
import { redirect } from 'next/navigation';
import { pageUser } from '@/lib/auth.js';
export default async function Page() {
  const user = await pageUser();
  redirect(user.role === 'admin' ? '/admin' : '/participant');
}
