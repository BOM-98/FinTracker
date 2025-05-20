'use server';

import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/lib/amplifyServerUtils';
import { fetchAuthSession } from '@aws-amplify/auth/server';

export async function fetchUserSession() {
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec)
    });
    const idToken = session.tokens?.idToken?.toString();

    if (!idToken) {
      throw new Error(
        'Authentication failed. Missing ID token after client-side sign-in.'
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('idToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600
    });

    return { success: true };
  } catch (error: any) {
    console.error('Login Action Error (Post Client Sign-in):', error);
    throw new Error(
      error.message ||
        'An unexpected error occurred during server session setup.'
    );
  }
}
