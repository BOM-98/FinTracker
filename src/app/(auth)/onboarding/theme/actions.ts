'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server-auth';
import type { AuthResult } from '@/lib/auth/types';

export async function updateTheme(theme: string): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('users')
    .update({ theme })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating theme:', error);
    return { success: false, error: 'Failed to update theme' };
  }

  // Update set_onboarding_preferences_at timestamp
  await supabase
    .from('users')
    .update({ set_onboarding_preferences_at: new Date().toISOString() })
    .eq('id', user.id);

  return { success: true };
}
