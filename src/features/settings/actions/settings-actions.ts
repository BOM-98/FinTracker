'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  ProfileFormValues,
  HouseholdFormValues,
  PreferencesFormValues,
  ThemeFormValues
} from '../utils/form-schemas';

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Get current user and family settings
 */
export async function getSettings() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error('Not authenticated');
  }

  // Fetch user settings
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, theme, family_id')
    .eq('id', authUser.id)
    .single();

  if (userError || !userData) {
    throw new Error('Failed to fetch user settings');
  }

  // Fetch family settings
  const { data: familyData, error: familyError } = await supabase
    .from('families')
    .select('id, name, country, currency, date_format, timezone, locale')
    .eq('id', userData.family_id)
    .single();

  if (familyError || !familyData) {
    throw new Error('Failed to fetch family settings');
  }

  return {
    user: userData,
    family: familyData
  };
}

/**
 * Update user profile (first name, last name)
 */
export async function updateProfile(
  data: ProfileFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('users')
      .update({
        first_name: data.first_name,
        last_name: data.last_name
      })
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Failed to update profile' };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update household name
 */
export async function updateHousehold(
  data: HouseholdFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's family_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'Failed to fetch user data' };
    }

    // Update family name
    const { error } = await supabase
      .from('families')
      .update({
        name: data.name
      })
      .eq('id', userData.family_id);

    if (error) {
      console.error('Household update error:', error);
      return { success: false, error: 'Failed to update household name' };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Update household error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update preferences (country, currency, date format)
 */
export async function updatePreferences(
  data: PreferencesFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's family_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'Failed to fetch user data' };
    }

    // Update family preferences
    const { error } = await supabase
      .from('families')
      .update({
        country: data.country,
        currency: data.currency,
        date_format: data.date_format
      })
      .eq('id', userData.family_id);

    if (error) {
      console.error('Preferences update error:', error);
      return { success: false, error: 'Failed to update preferences' };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Update preferences error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update theme preference
 */
export async function updateTheme(
  data: ThemeFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('users')
      .update({
        theme: data.theme
      })
      .eq('id', user.id);

    if (error) {
      console.error('Theme update error:', error);
      return { success: false, error: 'Failed to update theme' };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Update theme error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
