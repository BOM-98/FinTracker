'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserData } from '@/lib/auth/server-auth';
import type { AuthResult } from '@/lib/auth/types';

interface PreferencesData {
  currency: string;
  dateFormat: string;
}

export async function updatePreferences(
  data: PreferencesData
): Promise<AuthResult> {
  const userData = await getUserData();
  if (!userData) {
    return { success: false, error: 'User not found' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('families')
    .update({
      currency: data.currency,
      date_format: data.dateFormat
    })
    .eq('id', userData.familyId);

  if (error) {
    console.error('Error updating preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }

  return { success: true };
}

export async function getCurrentSettings() {
  const userData = await getUserData();
  if (!userData) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('families')
    .select('currency, date_format')
    .eq('id', userData.familyId)
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  return {
    currency: data.currency,
    dateFormat: data.date_format
  };
}
