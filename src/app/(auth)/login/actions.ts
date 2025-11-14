'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AuthResult } from '@/lib/auth/types';

/**
 * Server action to log in a user with email and password
 */
export async function loginAction(
  formData: FormData
): Promise<AuthResult | never> {
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required.'
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Login failed. Please check your credentials.'
    };
  }

  // Successful login - redirect to dashboard
  redirect('/dashboard');
}

/**
 * Server action to log out the current user
 */
export async function logoutAction(): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: error.message || 'Logout failed.'
    };
  }

  return { success: true };
}
