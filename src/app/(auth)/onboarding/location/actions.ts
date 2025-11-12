'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserData } from '@/lib/auth/server-auth';
import type { AuthResult } from '@/lib/auth/types';

interface UpdateCountryData {
  country: string;
  currency: string;
  dateFormat: string;
}

export async function updateCountry(data: UpdateCountryData): Promise<AuthResult> {
  const userData = await getUserData();
  if (!userData) {
    return { success: false, error: 'User not found' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('families')
    .update({
      country: data.country,
      currency: data.currency,
      date_format: data.dateFormat
    })
    .eq('id', userData.familyId);

  if (error) {
    console.error('Error updating country:', error);
    return { success: false, error: 'Failed to update location settings' };
  }

  return { success: true };
}
