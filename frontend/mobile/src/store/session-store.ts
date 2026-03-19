import type { AuthSession, UserRole } from '@livegate/shared';
import { create } from 'zustand';
import { Platform } from 'react-native';

interface SessionState {
  hydrated: boolean;
  hasSeenOnboarding: boolean;
  preferredRole: UserRole;
  session: AuthSession | null;
  setHydrated: (hydrated: boolean) => void;
  completeOnboarding: () => void;
  setPreferredRole: (role: UserRole) => void;
  setSession: (session: AuthSession | null) => void;
  signOut: () => void;
}

// Only use persist middleware on native platforms
const createStore = () => {
  if (Platform.OS === 'web') {
    // Web platform: skip persist middleware to avoid import.meta issues
    return create<SessionState>((set) => ({
      hydrated: true,
      hasSeenOnboarding: false,
      preferredRole: 'viewer',
      session: null,
      setHydrated: (hydrated) => set({ hydrated }),
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      setPreferredRole: (preferredRole) => set({ preferredRole }),
      setSession: (session) => set({ session }),
      signOut: () => set({ session: null }),
    }));
  } else {
    // Native platform: use persist middleware
    const { createJSONStorage, persist } = require('zustand/middleware');
    const { fileStorage } = require('./persist-storage');

    return create<SessionState>()(
      persist(
        (set) => ({
          hydrated: false,
          hasSeenOnboarding: false,
          preferredRole: 'viewer',
          session: null,
          setHydrated: (hydrated) => set({ hydrated }),
          completeOnboarding: () => set({ hasSeenOnboarding: true }),
          setPreferredRole: (preferredRole) => set({ preferredRole }),
          setSession: (session) => set({ session }),
          signOut: () => set({ session: null }),
        }),
        {
          name: 'livegate-mobile-session',
          storage: createJSONStorage(() => fileStorage),
          partialize: (state) => ({
            hasSeenOnboarding: state.hasSeenOnboarding,
            preferredRole: state.preferredRole,
            session: state.session,
          }),
          onRehydrateStorage: () => (state) => {
            state?.setHydrated(true);
          },
        },
      ),
    );
  }
};

export const useSessionStore = createStore();
