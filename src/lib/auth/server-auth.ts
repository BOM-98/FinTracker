/**
 * Server-Side Authentication & Authorization Helpers
 *
 * SECURITY: All role and permission checks MUST be done server-side.
 * Never trust client-side role checks for authorization.
 *
 * Use these helpers in:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 * - API Routes
 *
 * Note: These are NOT Server Actions - they are server-only utility functions.
 * Server Components can import and use these directly.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'member';

/**
 * Extended user data from database
 */
export interface ServerUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  familyId: string;
  familyName?: string;
  active: boolean;
}

/**
 * Authorization errors
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Get current authenticated user
 *
 * Returns the Supabase auth user if logged in, null otherwise.
 * Does NOT throw errors - use requireAuth() if you need to enforce authentication.
 *
 * CACHING: Results are cached per request using React cache()
 *
 * @example
 * ```tsx
 * export default async function Page() {
 *   const user = await getCurrentUser()
 *   if (!user) return <LoginPrompt />
 *   return <Dashboard />
 * }
 * ```
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
});

/**
 * Get current user's extended profile data
 *
 * Fetches user profile from the users table including role and family info.
 * Returns null if user is not authenticated or profile not found.
 *
 * CACHING: Results are cached per request using React cache()
 *
 * @example
 * ```tsx
 * export default async function ProfilePage() {
 *   const userData = await getUserData()
 *   if (!userData) redirect('/login')
 *   return <Profile user={userData} />
 * }
 * ```
 */
export const getUserData = cache(async (): Promise<ServerUserData | null> => {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return null;
  }

  const supabase = await createClient();

  const { data: userData, error } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      first_name,
      last_name,
      role,
      family_id,
      active,
      families (
        name
      )
    `
    )
    .eq('id', authUser.id)
    .single();

  if (error || !userData) {
    console.error('Error fetching user data:', error);
    return null;
  }

  return {
    id: userData.id,
    email: userData.email,
    firstName: userData.first_name || '',
    lastName: userData.last_name || '',
    role: userData.role as UserRole,
    familyId: userData.family_id,
    familyName: (userData.families as any)?.name,
    active: userData.active
  };
});

/**
 * Require authentication
 *
 * Throws UnauthorizedError if user is not authenticated.
 * Use this in Server Actions and API routes that require auth.
 *
 * For pages, use requireAuthRedirect() instead to redirect to login.
 *
 * @example
 * ```tsx
 * 'use server'
 *
 * export async function updateProfile(data: FormData) {
 *   const user = await requireAuth()
 *   // ... proceed with authenticated action
 * }
 * ```
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  return user;
}

/**
 * Require authentication with redirect
 *
 * Redirects to login page if user is not authenticated.
 * Use this in Server Components (pages).
 *
 * @example
 * ```tsx
 * export default async function DashboardPage() {
 *   await requireAuthRedirect()
 *   // User is guaranteed to be authenticated here
 *   return <Dashboard />
 * }
 * ```
 */
export async function requireAuthRedirect(redirectTo = '/login') {
  const user = await getCurrentUser();

  if (!user) {
    redirect(redirectTo);
  }

  return user;
}

/**
 * Check if current user has admin role
 *
 * Returns true if user is admin, false otherwise.
 * Returns false if user is not authenticated.
 *
 * SECURITY: This check is server-side only and cannot be bypassed.
 *
 * @example
 * ```tsx
 * export default async function AdminPage() {
 *   const isAdmin = await isAdmin()
 *   if (!isAdmin) return <Forbidden />
 *   return <AdminPanel />
 * }
 * ```
 */
export async function isAdmin(): Promise<boolean> {
  const userData = await getUserData();

  if (!userData) {
    return false;
  }

  return userData.role === 'admin';
}

/**
 * Require admin role
 *
 * Throws ForbiddenError if user is not an admin.
 * Throws UnauthorizedError if user is not authenticated.
 *
 * Use this in Server Actions and API routes that require admin access.
 *
 * @example
 * ```tsx
 * 'use server'
 *
 * export async function deleteAllUsers() {
 *   await requireAdmin()
 *   // ... proceed with admin action
 * }
 * ```
 */
export async function requireAdmin() {
  const userData = await getUserData();

  if (!userData) {
    throw new UnauthorizedError('Authentication required');
  }

  if (userData.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  return userData;
}

/**
 * Require admin role with redirect
 *
 * Redirects to login if not authenticated.
 * Redirects to unauthorized page if not admin.
 *
 * Use this in Server Components (pages) that require admin access.
 *
 * @example
 * ```tsx
 * export default async function AdminSettingsPage() {
 *   await requireAdminRedirect()
 *   // User is guaranteed to be an admin here
 *   return <AdminSettings />
 * }
 * ```
 */
export async function requireAdminRedirect(
  loginRedirect = '/login',
  unauthorizedRedirect = '/dashboard?error=unauthorized'
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(loginRedirect);
  }

  const userData = await getUserData();

  if (!userData || userData.role !== 'admin') {
    redirect(unauthorizedRedirect);
  }

  return userData;
}

/**
 * Check if user has access to a specific family's data
 *
 * Validates that the current user belongs to the specified family.
 * Use this to enforce multi-tenant data isolation.
 *
 * SECURITY: Critical for preventing cross-family data access.
 *
 * @example
 * ```tsx
 * 'use server'
 *
 * export async function getFamilyData(familyId: string) {
 *   await requireFamilyAccess(familyId)
 *   // User is guaranteed to have access to this family's data
 *   return await fetchFamilyData(familyId)
 * }
 * ```
 */
export async function requireFamilyAccess(familyId: string) {
  const userData = await getUserData();

  if (!userData) {
    throw new UnauthorizedError('Authentication required');
  }

  if (userData.familyId !== familyId) {
    throw new ForbiddenError('Access to this family data is not allowed');
  }

  return userData;
}

/**
 * Check if user account is active
 *
 * Some operations should only be available to active users.
 *
 * @example
 * ```tsx
 * 'use server'
 *
 * export async function createTransaction() {
 *   const userData = await requireActiveUser()
 *   // Proceed with transaction creation
 * }
 * ```
 */
export async function requireActiveUser() {
  const userData = await getUserData();

  if (!userData) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!userData.active) {
    throw new ForbiddenError('Account is inactive');
  }

  return userData;
}

/**
 * Get user's family ID
 *
 * Convenience function to get the current user's family ID.
 * Returns null if user is not authenticated.
 *
 * @example
 * ```tsx
 * export default async function FamilyDashboard() {
 *   const familyId = await getCurrentFamilyId()
 *   if (!familyId) redirect('/login')
 *
 *   const familyData = await fetchFamilyData(familyId)
 *   return <Dashboard data={familyData} />
 * }
 * ```
 */
export async function getCurrentFamilyId(): Promise<string | null> {
  const userData = await getUserData();
  return userData?.familyId || null;
}

/**
 * Require user to NOT be onboarded (for onboarding pages)
 *
 * Redirects to dashboard if already onboarded.
 * Redirects to login if not authenticated.
 *
 * Use this in onboarding pages to ensure users don't access
 * onboarding flow if they've already completed it.
 *
 * @example
 * ```tsx
 * export default async function OnboardingLayout({ children }) {
 *   await requireNotOnboarded()
 *   // User is authenticated but not yet onboarded
 *   return <>{children}</>
 * }
 * ```
 */
export async function requireNotOnboarded() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  const { data: userData } = await supabase
    .from('users')
    .select('onboarded_at')
    .eq('id', user.id)
    .single();

  if (userData?.onboarded_at) {
    redirect('/dashboard'); // Already onboarded
  }

  return user;
}
