import { normalizeAuthSession, switchSessionRole, type AuthSession, type UserRole } from '@livegate/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface SessionState {
  session: AuthSession | null;
  preferredRole: UserRole;
  preferredRoles: UserRole[];
  theme: ThemeMode;
  setSession: (session: AuthSession | null) => void;
  setPreferredRole: (role: UserRole) => void;
  setPreferredRoles: (roles: UserRole[], activeRole?: UserRole) => void;
  setActiveRole: (role: UserRole) => void;
  toggleTheme: () => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      preferredRole: 'viewer',
      preferredRoles: ['viewer'],
      theme: 'light',
      setSession: (session) =>
        set((state) => ({
          session:
            session === null
              ? null
              : normalizeAuthSession(session, state.preferredRoles, state.preferredRole),
        })),
      setPreferredRole: (preferredRole) =>
        set((state) => ({
          preferredRole,
          preferredRoles: state.preferredRoles.includes(preferredRole)
            ? state.preferredRoles
            : [preferredRole],
        })),
      setPreferredRoles: (roles, activeRole) =>
        set({
          preferredRoles: Array.from(new Set(roles)),
          preferredRole: activeRole ?? roles[0] ?? 'viewer',
        }),
      setActiveRole: (role) =>
        set((state) => ({
          preferredRole: role,
          session: switchSessionRole(state.session, role),
        })),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      signOut: () => set({ session: null, preferredRole: 'viewer', preferredRoles: ['viewer'] }),
    }),
    {
      name: 'livegate-web-session',
      partialize: (state) => ({
        session: state.session,
        preferredRole: state.preferredRole,
        preferredRoles: state.preferredRoles,
        theme: state.theme,
      }),
    },
  ),
);
