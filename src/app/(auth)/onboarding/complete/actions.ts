'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getUserData } from '@/lib/auth/server-auth';
import type { AuthResult } from '@/lib/auth/types';

export async function completeOnboarding(): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Set onboarded_at timestamp
  const { error } = await supabase
    .from('users')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('Error completing onboarding:', error);
    return { success: false, error: 'Failed to complete onboarding' };
  }

  return { success: true };
}

export async function getOnboardingSummary() {
  const userData = await getUserData();
  if (!userData) return null;

  const supabase = await createClient();

  const { data: familyData } = await supabase
    .from('families')
    .select('name, country, currency, date_format')
    .eq('id', userData.familyId)
    .single();

  const { data: userPrefs } = await supabase
    .from('users')
    .select('theme')
    .eq('id', userData.id)
    .single();

  return {
    householdName: familyData?.name,
    country: familyData?.country,
    currency: familyData?.currency,
    dateFormat: familyData?.date_format,
    theme: userPrefs?.theme
  };
}
