import { createClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

/**
 * Route handler for email verification via magic link
 *
 * When users click the verification link in their email, they'll be redirected here
 * with token_hash and type parameters. This handler verifies the OTP and redirects
 * to the appropriate page.
 *
 * Example URL: /confirm-signup?token_hash=xxx&type=signup&next=/dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  // Validate required parameters
  if (token_hash && type) {
    //  CORRECT for Next.js 15 - await createClient()
    const supabase = await createClient();

    // Verify the OTP token
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    // If verification successful, redirect to next page
    if (!error) {
      redirect(next);
    }

    // Log error for debugging
    console.error('Email verification error:', error);
  }

  // If verification failed or params missing, redirect to error page
  redirect('/login?error=verification_failed');
}
