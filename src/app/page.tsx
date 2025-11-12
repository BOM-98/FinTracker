import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server-auth';

/**
 * Root page - redirects based on authentication status
 * - Authenticated users → /dashboard
 * - Unauthenticated users → /login
 */
export default async function Page() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
