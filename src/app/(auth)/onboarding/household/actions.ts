'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, getUserData } from '@/lib/auth/server-auth';
import type { AuthResult } from '@/lib/auth/types';

export async function updateHouseholdName(name: string): Promise<AuthResult> {
  if (!name || name.trim().length < 2) {
    return {
      success: false,
      error: 'Household name must be at least 2 characters'
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const userData = await getUserData();
  if (!userData) {
    return { success: false, error: 'User profile not found' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('families')
    .update({ name: name.trim() })
    .eq('id', userData.familyId);

  if (error) {
    console.error('Error updating household name:', error);
    return { success: false, error: 'Failed to update household name' };
  }

  return { success: true };
}
