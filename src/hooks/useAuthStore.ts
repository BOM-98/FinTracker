'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

/**
 * User profile data (non-sensitive information only)
 *
 * SECURITY NOTE: This store does NOT contain:
 * - ❌ Tokens (stored in httpOnly cookies by Supabase)
 * - ❌ Passwords
 * - ❌ Roles (validated server-side only)
 * - ❌ Permissions (checked server-side only)
 *
 * This data is for UI display purposes only.
 * All authorization MUST be done server-side.
 */
export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  familyId?: string;
  familyName?: string;
} | null;

/**
 * Auth store state
 */
type AuthState = {
  user: UserProfile;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadUser: () => Promise<void>;
  clearUser: () => void;
  updateProfile: (updates: Partial<Exclude<UserProfile, null>>) => void;
};

/**
 * Initial state
 */
const initialState = {
  user: null,
  isLoading: false,
  error: null
};

/**
 * Auth Store (Zustand)
 *
 * PURPOSE:
 * - Cache user profile data for Client Components
 * - Reduce database queries for repeated UI access
 * - Provide fast, synchronous access to user info
 *
 * SECURITY:
 * - No tokens stored (httpOnly cookies only)
 * - No role-based authorization (server-side only)
 * - Data is for display purposes only
 *
 * USAGE:
 * ```tsx
 * 'use client'
 *
 * function UserAvatar() {
 *   const { user, loadUser } = useAuthStore()
 *
 *   useEffect(() => {
 *     loadUser()
 *   }, [loadUser])
 *
 *   if (!user) return null
 *
 *   return <Avatar src={user.avatarUrl} name={user.firstName} />
 * }
 * ```
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  /**
   * Load user profile from Supabase
   *
   * This fetches the current user from Supabase auth and their
   * extended profile from the users table.
   *
   * SECURITY: Tokens remain in httpOnly cookies, never exposed to JS
   */
  loadUser: async () => {
    try {
      set({ isLoading: true, error: null });

      const supabase = createClient();

      // Get auth user (from session cookies)
      const {
        data: { user: authUser },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authUser) {
        // No user logged in
        set({ user: null, isLoading: false, error: null });
        return;
      }

      // Get extended profile from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(
          `
          id,
          email,
          first_name,
          last_name,
          family_id,
          families (
            name
          )
        `
        )
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('Error loading user profile:', userError);
        // Still set basic info from auth user
        set({
          user: {
            id: authUser.id,
            email: authUser.email!,
            firstName: authUser.user_metadata?.first_name || '',
            lastName: authUser.user_metadata?.last_name || '',
            avatarUrl: authUser.user_metadata?.avatar_url || null
          },
          isLoading: false,
          error: 'Could not load full profile'
        });
        return;
      }

      // Set complete user profile
      set({
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          avatarUrl: authUser.user_metadata?.avatar_url || null,
          familyId: userData.family_id || undefined,
          familyName: (userData.families as any)?.name || undefined
        },
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      console.error('Error loading user:', err);
      set({
        user: null,
        isLoading: false,
        error: err.message || 'Failed to load user'
      });
    }
  },

  /**
   * Clear user from store
   *
   * NOTE: This does NOT log the user out of Supabase.
   * It only clears the client-side cache.
   *
   * For actual logout, use the logout server action.
   */
  clearUser: () => {
    set({ ...initialState });
  },

  /**
   * Update user profile in store (optimistic update)
   *
   * This updates the local cache immediately for better UX.
   * The actual server update should happen separately.
   *
   * EXAMPLE:
   * ```tsx
   * const { updateProfile } = useAuthStore()
   *
   * // Optimistic update
   * updateProfile({ firstName: 'John' })
   *
   * // Then persist to server
   * await updateUserProfile({ firstName: 'John' })
   * ```
   */
  updateProfile: (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;

    set({
      user: {
        ...currentUser,
        ...updates
      }
    });
  }
}));

/**
 * Hook to get user display name
 *
 * Convenience hook for displaying user's full name
 */
export function useUserDisplayName(): string {
  const user = useAuthStore((state) => state.user);

  if (!user) return 'Guest';

  const { firstName, lastName } = user;

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) return firstName;
  if (lastName) return lastName;

  return user.email.split('@')[0]; // Fallback to email username
}

/**
 * Hook to get user initials
 *
 * Convenience hook for avatar displays
 */
export function useUserInitials(): string {
  const user = useAuthStore((state) => state.user);

  if (!user) return '??';

  const { firstName, lastName } = user;

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (lastName) return lastName.slice(0, 2).toUpperCase();

  return user.email.slice(0, 2).toUpperCase();
}
