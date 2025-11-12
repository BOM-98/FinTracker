'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AuthResult, SignupData } from '@/lib/auth/types';

/**
 * Server action for user registration
 *
 * Creates a Supabase auth user. A database trigger automatically creates
 * the family and user profile records immediately when auth.users is inserted.
 *
 * Flow:
 * 1. Create Supabase auth user with metadata (firstName, lastName)
 * 2. Database trigger fires → creates family and user profile records
 * 3. Redirect to email confirmation page
 * 4. After email verification → User can access onboarding to customize data
 * 5. Onboarding updates the existing records and sets onboarded_at when complete
 */
export async function signupAction(
  data: SignupData
): Promise<AuthResult | never> {
  const { email, password, firstName, lastName } = data;

  // Validate required fields
  if (!email || !password || !firstName || !lastName) {
    return {
      success: false,
      error: 'Email, password, first name, and last name are required.'
    };
  }

  const supabase = await createClient();

  // Create Supabase auth user with minimal metadata
  console.log('📝 Creating Supabase auth user...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });

  if (authError) {
    console.error('❌ Auth signup error:', authError);
    return {
      success: false,
      error: authError.message || 'Failed to create account. Please try again.'
    };
  }

  if (!authData.user) {
    return {
      success: false,
      error: 'Failed to create user account.'
    };
  }

  console.log('✅ Auth user created:', authData.user.id);
  console.log(
    '📧 Verification email sent. Database trigger has created family and user profile records.'
  );

  // Redirect to email confirmation page
  // Note: redirect() throws internally - this is expected Next.js behavior
  redirect('/confirm-signup');
}
