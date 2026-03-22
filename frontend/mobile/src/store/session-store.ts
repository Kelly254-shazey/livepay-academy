import {
  normalizeAuthSession,
  switchSessionRole,
  type AuthSession,
  type UserRole,
} from '@livegate/shared';
import { create } from 'zustand';
import { Platform } from 'react-native';

interface SessionState {
  hydrated: boolean;
  hasSeenOnboarding: boolean;
  preferredRole: UserRole;
  preferredRoles: UserRole[];
  session: AuthSession | null;
  unlockedDemoLiveIds: string[];
  setHydrated: (hydrated: boolean) => void;
  completeOnboarding: () => void;
  setPreferredRole: (role: UserRole) => void;
  setPreferredRoles: (roles: UserRole[], activeRole?: UserRole) => void;
  setActiveRole: (role: UserRole) => void;
  setSession: (session: AuthSession | null) => void;
  unlockDemoLiveAccess: (liveId: string) => void;
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
      preferredRoles: ['viewer'],
      session: null,
      unlockedDemoLiveIds: [],
      setHydrated: (hydrated) => set({ hydrated }),
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
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
      setSession: (session) =>
        set((state) => ({
          session:
            session === null
              ? null
              : normalizeAuthSession(session, state.preferredRoles, state.preferredRole),
        })),
      unlockDemoLiveAccess: (liveId) =>
        set((state) => ({
          unlockedDemoLiveIds: state.unlockedDemoLiveIds.includes(liveId)
            ? state.unlockedDemoLiveIds
            : [...state.unlockedDemoLiveIds, liveId],
        })),
      signOut: () =>
        set({ session: null, preferredRole: 'viewer', preferredRoles: ['viewer'], unlockedDemoLiveIds: [] }),
    }));
  } else {
    // Native platform: use persist middleware
    const { createJSONStorage, persist } = require('zustand/middleware');
    const { fileStorage } = require('./persist-storage');

    return create<SessionState>()(
      persist(
        (set: any) => ({
          hydrated: false,
          hasSeenOnboarding: false,
          preferredRole: 'viewer',
          preferredRoles: ['viewer'],
          session: null,
          unlockedDemoLiveIds: [],
          setHydrated: (hydrated: boolean) => set({ hydrated }),
          completeOnboarding: () => set({ hasSeenOnboarding: true }),
          setPreferredRole: (preferredRole: UserRole) =>
            set((state: SessionState) => ({
              preferredRole,
              preferredRoles: state.preferredRoles.includes(preferredRole)
                ? state.preferredRoles
                : [preferredRole],
            })),
          setPreferredRoles: (roles: UserRole[], activeRole?: UserRole) =>
            set({
              preferredRoles: Array.from(new Set(roles)),
              preferredRole: activeRole ?? roles[0] ?? 'viewer',
            }),
          setActiveRole: (role: UserRole) =>
            set((state: SessionState) => ({
              preferredRole: role,
              session: switchSessionRole(state.session, role),
            })),
          setSession: (session: AuthSession | null) =>
            set((state: SessionState) => ({
              session:
                session === null
                  ? null
                  : normalizeAuthSession(session, state.preferredRoles, state.preferredRole),
            })),
          unlockDemoLiveAccess: (liveId: string) =>
            set((state: SessionState) => ({
              unlockedDemoLiveIds: state.unlockedDemoLiveIds.includes(liveId)
                ? state.unlockedDemoLiveIds
                : [...state.unlockedDemoLiveIds, liveId],
            })),
          signOut: () =>
            set({ session: null, preferredRole: 'viewer', preferredRoles: ['viewer'], unlockedDemoLiveIds: [] }),
        }),
        {
          name: 'livegate-mobile-session',
          storage: createJSONStorage(() => fileStorage),
          partialize: (state: SessionState) => ({
            hasSeenOnboarding: state.hasSeenOnboarding,
            preferredRole: state.preferredRole,
            preferredRoles: state.preferredRoles,
            session: state.session,
            unlockedDemoLiveIds: state.unlockedDemoLiveIds,
          }),
          onRehydrateStorage: () => (state?: SessionState) => {
            state?.setHydrated(true);
          },
        },
      ),
    );
  }
};

export const useSessionStore = createStore();
