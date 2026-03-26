import { normalizeAuthSession, switchSessionRole, type AuthSession, type UserRole } from '../lib/shared';
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

function normalizeRoles(roles: UserRole[]) {
  return Array.from(new Set(roles));
}

function rolesMatch(left: UserRole[], right: UserRole[]) {
  return left.length === right.length && left.every((role, index) => role === right[index]);
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
        set((state) => {
          const preferredRoles = state.preferredRoles.includes(preferredRole)
            ? state.preferredRoles
            : [preferredRole];

          if (state.preferredRole === preferredRole && rolesMatch(state.preferredRoles, preferredRoles)) {
            return state;
          }

          return {
            preferredRole,
            preferredRoles,
          };
        }),
      setPreferredRoles: (roles, activeRole) =>
        set((state) => {
          const preferredRoles = normalizeRoles(roles);
          const preferredRole = activeRole ?? preferredRoles[0] ?? 'viewer';

          if (state.preferredRole === preferredRole && rolesMatch(state.preferredRoles, preferredRoles)) {
            return state;
          }

          return {
            preferredRoles,
            preferredRole,
          };
        }),
      setActiveRole: (role) =>
        set((state) => {
          if (state.preferredRole === role) {
            return state;
          }

          return {
            preferredRole: role,
            session: switchSessionRole(state.session, role),
          };
        }),
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
