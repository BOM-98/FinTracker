'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthResult = {
  success: boolean;
  error?: string;
};

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
 * Server action to sign up a new user with email and password
 */
export async function signupAction(
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Optional: Add email redirect URL for confirmation
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`
    }
  });

  if (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: error.message || 'Signup failed. Please try again.'
    };
  }

  // If email confirmation is enabled, redirect to confirmation page
  redirect('/confirm-signup');
}

/**
 * Server action to log in with GitHub OAuth
 */
export async function loginWithGithubAction(): Promise<AuthResult | never> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`
    }
  });

  if (error) {
    console.error('GitHub OAuth error:', error);
    return {
      success: false,
      error: error.message || 'GitHub login failed.'
    };
  }

  if (data.url) {
    // Redirect to GitHub OAuth page
    redirect(data.url);
  }

  return {
    success: false,
    error: 'Failed to initiate GitHub login.'
  };
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
