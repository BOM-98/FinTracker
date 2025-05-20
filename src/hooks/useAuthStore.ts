'use client';

import { create } from 'zustand';
import { fetchAuthSession, signOut } from '@aws-amplify/auth';
import type { UserDetails } from '@/models/user.model';

/**
 * Represents the shape of our Auth state.
 */
type AuthState = {
  token: string;
  idToken: string;
  accessToken: string;
  isLoggedIn: boolean;
  user: UserDetails;
  loading: boolean;
  error: string | null;

  loadUserDetails: () => Promise<void>;
  logoutUser: () => Promise<void>;
  setAuthSession: (partialAuth: Partial<AuthState>) => void;
  clearAuthSession: () => void;
};

/**
 * Define the initial state
 */
const initialAuthState = {
  token: '',
  idToken: '',
  accessToken: '',
  isLoggedIn: false,
  user: {
    email: '',
    firstName: '',
    lastName: '',
    role: 'Unknown',
    roles: [],
    admin: false,
    superAdmin: false,
    dash: false,
    bb: false,
    instanceId: ''
  },
  loading: false,
  error: null as string | null
};

/**
 * useAuthStore:
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialAuthState,

  /**
   * loadUserDetails:
   * extracts user details, roles, tokens, etc.
   */
  loadUserDetails: async () => {
    try {
      set({ loading: true, error: null });
      const session = await fetchAuthSession();

      if (!session.tokens?.idToken?.payload) {
        throw new Error('No ID token payload found.');
      }

      const payload = session.tokens.idToken.payload;
      const email = String(payload.email ?? '');
      const firstName = String(payload.given_name ?? '');
      const lastName = String(payload.family_name ?? '');
      const roles = (payload['cognito:groups'] as string[]) || [];

      // Determine role from roles array
      let role = 'Unknown';
      let admin = false;
      let superAdmin = false;
      if (roles.includes('SuperAdmin')) {
        role = 'SuperAdmin';
        admin = true;
        superAdmin = true;
      } else if (roles.includes('Admin')) {
        role = 'Admin';
        admin = true;
      } else if (roles.includes('Member')) {
        role = 'Member';
      }

      const idToken = session.tokens.idToken.toString();
      const accessToken = session.tokens.accessToken.toString();

      // Set state
      set({
        loading: false,
        error: null,
        idToken,
        accessToken,
        isLoggedIn: true,
        user: {
          email,
          firstName,
          lastName,
          role,
          roles,
          admin,
          superAdmin,
          dash: false,
          bb: false
        }
      });
    } catch (err: any) {
      console.error('Error loading user details:', err);
      set({
        loading: false,
        error: err.message || 'Failed to load user details.',
        isLoggedIn: false
      });
    }
  },

  /**
   * logoutUser:
   */
  logoutUser: async () => {
    try {
      await signOut();
      // Clear everything after signout
      set({
        idToken: '',
        accessToken: '',
        token: '',
        isLoggedIn: false,
        user: { ...initialAuthState.user },
        error: null,
        loading: false
      });
    } catch (err: any) {
      console.error('Error during signout:', err);
      set({ error: err.message || 'Error signing out.' });
    }
  },

  /**
   * setAuthSession:
   */
  setAuthSession: (partialAuth) => {
    set((state) => ({
      idToken: partialAuth.idToken ?? state.idToken,
      accessToken: partialAuth.accessToken ?? state.accessToken,
      token: partialAuth.token ?? state.token,
      // merge user objects if present
      user: partialAuth.user
        ? {
            ...state.user,
            ...partialAuth.user
          }
        : state.user,
      isLoggedIn: true
    }));
  },

  /**
   * clearAuthSession:
   */
  clearAuthSession: () => {
    set({
      idToken: '',
      accessToken: '',
      token: '',
      isLoggedIn: false,
      user: { ...initialAuthState.user }
    });
  }
}));
