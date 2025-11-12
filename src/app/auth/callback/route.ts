import { createClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

/**
 * Route handler for email verification via magic link
 *
 * When users click the verification link in their email, they'll be redirected here
 * with token_hash and type parameters. This handler verifies the OTP and redirects
 * based on onboarding status.
 *
 * Note: Family and user profile records are created automatically by a database
 * trigger when auth.users is inserted (during registration), so they already exist
 * by the time we reach this callback.
 *
 * Redirects:
 * - Not onboarded: /onboarding/household (to customize default data)
 * - Already onboarded: /dashboard
 *
 * Example URL: /auth/callback?token_hash=xxx&type=signup
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  // Validate required parameters
  if (token_hash && type) {
    //  CORRECT for Next.js 15 - await createClient()
    const supabase = await createClient();

    // Verify the OTP token
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    // If verification successful, check onboarding status
    if (!error) {
      // Get the authenticated user
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        // Check onboarding completion status
        const { data: userData, error: userQueryError } = await supabase
          .from('users')
          .select('onboarded_at')
          .eq('id', user.id)
          .single();

        // If query failed or user record missing, something went wrong
        // This shouldn't happen since the trigger creates records during registration
        if (userQueryError || !userData) {
          console.error('❌ User record not found after email verification:', {
            userId: user.id,
            error: userQueryError
          });
          redirect('/login?error=profile_missing');
        }

        // If onboarding not completed, redirect to onboarding to customize data
        if (!userData.onboarded_at) {
          console.log('📝 Redirecting to onboarding to customize profile');
          redirect('/onboarding/household');
        }

        // User is fully onboarded, go to dashboard
        console.log('✅ User fully onboarded, redirecting to dashboard');
        redirect('/dashboard');
      }
    }

    // Log error for debugging
    console.error('Email verification error:', error);
  }

  // If verification failed or params missing, redirect to error page
  redirect('/login?error=verification_failed');
}
