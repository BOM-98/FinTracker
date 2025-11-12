'use server';

import { createClient } from '@/lib/supabase/server';
import type { ResendVerificationResult } from '@/lib/auth/types';

/**
 * Resend verification email to the current user
 *
 * This action gets the current user's email from the session
 * and sends a new verification email.
 */
export async function resendVerificationEmail(): Promise<ResendVerificationResult> {
  try {
    const supabase = await createClient();

    // Get current user from session
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Unable to get user session. Please try logging in again.'
      };
    }

    // Resend verification email
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (resendError) {
      console.error('Error resending verification email:', resendError);
      return {
        success: false,
        error: resendError.message || 'Failed to resend verification email'
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in resendVerificationEmail:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}
