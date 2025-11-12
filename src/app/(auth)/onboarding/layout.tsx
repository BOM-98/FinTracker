import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Onboarding Layout
 *
 * Protects onboarding routes and checks completion status.
 *
 * Note: User profile creation is handled automatically by a database trigger
 * when auth.users is created, so we don't need to create records here.
 */
export default async function OnboardingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Require authentication
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if user has completed onboarding
  const { data: userData } = await supabase
    .from('users')
    .select('onboarded_at')
    .eq('id', user.id)
    .single();

  // If already onboarded, redirect to dashboard
  if (userData?.onboarded_at) {
    redirect('/dashboard');
  }

  // User is authenticated but not yet onboarded - show onboarding
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}
