import type { AuthSession, UserRole } from '@livegate/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface SessionState {
  session: AuthSession | null;
  preferredRole: UserRole;
  theme: ThemeMode;
  setSession: (session: AuthSession | null) => void;
  setPreferredRole: (role: UserRole) => void;
  toggleTheme: () => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      preferredRole: 'viewer',
      theme: 'light',
      setSession: (session) => set({ session }),
      setPreferredRole: (preferredRole) => set({ preferredRole }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      signOut: () => set({ session: null }),
    }),
    {
      name: 'livegate-web-session',
      partialize: (state) => ({
        session: state.session,
        preferredRole: state.preferredRole,
        theme: state.theme,
      }),
    },
  ),
);
