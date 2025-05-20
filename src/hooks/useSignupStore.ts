'use client';

import { create } from 'zustand';

/**
 * This matches the Redux `SignupState` shape: just an "email" field.
 * Also defines actions to setEmail/clearEmail.
 */
type SignupStore = {
  email: string;
  setEmail: (email: string) => void;
  clearEmail: () => void;
};

export const useSignupStore = create<SignupStore>((set) => ({
  email: '',

  setEmail: (email) => set({ email }),

  clearEmail: () => set({ email: '' })
}));
