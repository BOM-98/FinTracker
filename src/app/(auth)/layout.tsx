import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server-auth';

/**
 * Auth Layout - protects authentication routes
 *
 * If user is already authenticated, redirect to /dashboard
 * Otherwise, render auth pages (login, register, confirm-signup)
 */
export default async function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // If user is already authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  // User is not authenticated, render auth pages
  return <>{children}</>;
}
