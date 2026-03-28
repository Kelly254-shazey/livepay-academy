import {
  normalizeAuthSession,
  switchSessionRole,
  type AuthSession,
  type UserRole,
} from '../shared';
import { create } from 'zustand';
import { Appearance, Platform } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
const validThemePreferences: ThemePreference[] = ['system', 'light', 'dark'];
const validUserRoles: UserRole[] = ['viewer', 'creator', 'moderator', 'admin'];

function normalizeThemePreference(themePreference: unknown): ThemePreference {
  return validThemePreferences.includes(themePreference as ThemePreference)
    ? (themePreference as ThemePreference)
    : 'system';
}

function normalizeUserRole(role: unknown, fallback: UserRole = 'viewer'): UserRole {
  return validUserRoles.includes(role as UserRole) ? (role as UserRole) : fallback;
}

function normalizeUserRoles(
  roles: unknown,
  fallbackRoles: UserRole[] = ['viewer'],
): UserRole[] {
  const source = Array.isArray(roles) ? roles : [roles];
  const normalized = Array.from(
    new Set(
      source.filter((item): item is UserRole =>
        validUserRoles.includes(item as UserRole),
      ),
    ),
  );

  return normalized.length ? normalized : fallbackRoles;
}

function isSessionShape(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AuthSession>;
  return Boolean(
    candidate.user &&
      typeof candidate.user === 'object' &&
      candidate.tokens &&
      typeof candidate.tokens === 'object',
  );
}

function sanitizeSession(
  session: unknown,
  preferredRoles: unknown,
  preferredRole: unknown,
): AuthSession | null {
  if (!isSessionShape(session)) {
    return null;
  }

  const fallbackRole = normalizeUserRole(
    session.activeRole ?? session.user.role ?? preferredRole,
  );
  const normalizedRoles = normalizeUserRoles(
    session.user.roles ?? preferredRoles,
    [fallbackRole],
  );

  return normalizeAuthSession(
    session,
    normalizedRoles,
    normalizeUserRole(preferredRole, fallbackRole),
  );
}

function sanitizePersistedState(
  value: Partial<SessionState> | undefined,
): Partial<SessionState> {
  const normalizedThemePreference = normalizeThemePreference(value?.themePreference);
  const preferredRole = normalizeUserRole(value?.preferredRole);
  const preferredRoles = normalizeUserRoles(value?.preferredRoles, [preferredRole]);

  return {
    hasSeenOnboarding: Boolean(value?.hasSeenOnboarding),
    preferredRole: preferredRoles.includes(preferredRole) ? preferredRole : preferredRoles[0],
    preferredRoles,
    session: sanitizeSession(value?.session, preferredRoles, preferredRole),
    unlockedDemoLiveIds: Array.isArray(value?.unlockedDemoLiveIds)
      ? value.unlockedDemoLiveIds.filter((item): item is string => typeof item === 'string')
      : [],
    demoLiveChats:
      value?.demoLiveChats && typeof value.demoLiveChats === 'object'
        ? value.demoLiveChats
        : initialDemoLiveChats,
    isDarkMode: resolveIsDarkMode(normalizedThemePreference),
    themePreference: normalizedThemePreference,
  };
}

function resolveIsDarkMode(themePreference: ThemePreference) {
  if (themePreference === 'dark') {
    return true;
  }

  if (themePreference === 'light') {
    return false;
  }

  return Appearance.getColorScheme() === 'dark';
}

export interface DemoLiveChatMessage {
  id: string;
  author: string;
  body: string;
  role: 'creator' | 'viewer';
}

const initialDemoLiveChats: Record<string, DemoLiveChatMessage[]> = {
  'creator-preview-live': [
    { id: 'creator-msg-1', author: 'viewer_18', body: 'We can hear you clearly now.', role: 'viewer' },
    { id: 'creator-msg-2', author: 'viewer_07', body: 'Please keep the camera steady for a moment.', role: 'viewer' },
    { id: 'creator-msg-3', author: 'viewer_26', body: 'This live is smooth. Waiting for the main topic.', role: 'viewer' },
    { id: 'creator-msg-4', author: 'viewer_31', body: 'Can you answer the last question from chat?', role: 'viewer' },
  ],
  'live-nairobi-city-lights': [
    { id: 'nairobi-msg-1', author: 'viewer_14', body: 'The skyline colors look clean tonight.', role: 'viewer' },
    { id: 'nairobi-msg-2', author: 'viewer_15', body: 'Watching from Kampala, stream quality is good.', role: 'viewer' },
    { id: 'nairobi-msg-3', author: 'viewer_16', body: 'That rooftop angle feels cinematic.', role: 'viewer' },
  ],
  'live-tokyo-after-dark': [
    { id: 'tokyo-msg-1', author: 'viewer_11', body: 'The neon reflections are sharp.', role: 'viewer' },
    { id: 'tokyo-msg-2', author: 'viewer_22', body: 'This feels like a real night walk.', role: 'viewer' },
    { id: 'tokyo-msg-3', author: 'viewer_29', body: 'Please keep the camera on this street for a bit longer.', role: 'viewer' },
  ],
  'live-coral-reef-window': [
    { id: 'reef-msg-1', author: 'viewer_08', body: 'The reef drift is so calming.', role: 'viewer' },
    { id: 'reef-msg-2', author: 'viewer_12', body: 'That fish pass was beautiful.', role: 'viewer' },
    { id: 'reef-msg-3', author: 'viewer_21', body: 'This is exactly the kind of slow live stream I wanted.', role: 'viewer' },
  ],
};

interface SessionState {
  hydrated: boolean;
  authBootstrapStatus: 'idle' | 'restoring' | 'ready';
  authBootstrapError: string | null;
  hasSeenOnboarding: boolean;
  preferredRole: UserRole;
  preferredRoles: UserRole[];
  session: AuthSession | null;
  unlockedDemoLiveIds: string[];
  demoLiveChats: Record<string, DemoLiveChatMessage[]>;
  isDarkMode: boolean;
  themePreference: ThemePreference;
  setHydrated: (hydrated: boolean) => void;
  setAuthBootstrapState: (
    status: SessionState['authBootstrapStatus'],
    error?: string | null,
  ) => void;
  completeOnboarding: () => void;
  setPreferredRole: (role: UserRole) => void;
  setPreferredRoles: (roles: UserRole[], activeRole?: UserRole) => void;
  setActiveRole: (role: UserRole) => void;
  setSession: (session: AuthSession | null) => void;
  unlockDemoLiveAccess: (liveId: string) => void;
  sendDemoLiveChatMessage: (
    liveId: string,
    message: Omit<DemoLiveChatMessage, 'id'>,
  ) => void;
  resetDemoLiveChat: (liveId: string) => void;
  setIsDarkMode: (isDark: boolean) => void;
  setThemePreference: (themePreference: ThemePreference) => void;
  signOut: () => void;
}

// Only use persist middleware on native platforms
const createStore = () => {
  if (Platform.OS === 'web') {
    // Web platform: skip persist middleware to avoid import.meta issues
    return create<SessionState>((set) => {
      const store: SessionState = {
        hydrated: true,
        authBootstrapStatus: 'idle',
        authBootstrapError: null,
        hasSeenOnboarding: false,
        preferredRole: 'viewer',
        preferredRoles: ['viewer'],
        session: null,
        unlockedDemoLiveIds: [],
        demoLiveChats: initialDemoLiveChats,
        isDarkMode: false,
        themePreference: 'system',
        setHydrated: (hydrated: boolean) => set({ hydrated }),
        setAuthBootstrapState: (authBootstrapStatus, authBootstrapError = null) =>
          set({ authBootstrapStatus, authBootstrapError }),
        completeOnboarding: () => set({ hasSeenOnboarding: true }),
        setPreferredRole: (preferredRole: UserRole) =>
          set((state) => {
            const normalizedPreferredRole = normalizeUserRole(preferredRole);
            const normalizedPreferredRoles = normalizeUserRoles(state.preferredRoles, [
              normalizedPreferredRole,
            ]);

            return {
              preferredRole: normalizedPreferredRole,
              preferredRoles: normalizedPreferredRoles.includes(normalizedPreferredRole)
                ? normalizedPreferredRoles
                : [normalizedPreferredRole],
            };
          }),
        setPreferredRoles: (roles: UserRole[], activeRole?: UserRole) =>
          set(() => {
            const normalizedPreferredRoles = normalizeUserRoles(
              roles,
              [normalizeUserRole(activeRole)],
            );
            return {
              preferredRoles: normalizedPreferredRoles,
              preferredRole: normalizeUserRole(
                activeRole,
                normalizedPreferredRoles[0] ?? 'viewer',
              ),
            };
          }),
        setActiveRole: (role: UserRole) =>
          set((state) => {
            const requestedRole = normalizeUserRole(role, state.preferredRole);
            const nextSession = switchSessionRole(state.session, requestedRole);
            const nextRole =
              nextSession?.activeRole ?? nextSession?.user.role ?? state.preferredRole;

            return {
              preferredRole: nextRole,
              session: nextSession,
            };
          }),
        setSession: (session: AuthSession | null) =>
          set((state) => {
            const normalizedSession = sanitizeSession(
              session,
              state.preferredRoles,
              state.preferredRole,
            );

            return {
              authBootstrapError: null,
              session: normalizedSession,
              preferredRoles:
                normalizedSession?.user.roles?.length
                  ? normalizedSession.user.roles
                  : state.preferredRoles,
              preferredRole: normalizedSession
                ? normalizeUserRole(
                    normalizedSession.activeRole ?? normalizedSession.user.role,
                    normalizedSession.user.roles?.[0] ?? state.preferredRole,
                  )
                : state.preferredRole,
            };
          }),
        unlockDemoLiveAccess: (liveId: string) =>
          set((state) => ({
            unlockedDemoLiveIds: state.unlockedDemoLiveIds.includes(liveId)
              ? state.unlockedDemoLiveIds
              : [...state.unlockedDemoLiveIds, liveId],
          })),
        sendDemoLiveChatMessage: (liveId: string, message: Omit<DemoLiveChatMessage, 'id'>) =>
          set((state) => ({
            demoLiveChats: {
              ...state.demoLiveChats,
              [liveId]: [
                ...(state.demoLiveChats[liveId] ?? []),
                { ...message, id: `${liveId}-${Date.now()}` },
              ],
            },
          })),
        resetDemoLiveChat: (liveId: string) =>
          set((state) => ({
            demoLiveChats: {
              ...state.demoLiveChats,
              [liveId]: initialDemoLiveChats[liveId] ?? [],
            },
          })),
        setIsDarkMode: (isDarkMode: boolean) =>
          set((state) => {
            const nextThemePreference = isDarkMode ? 'dark' : 'light';

            if (
              state.isDarkMode === isDarkMode &&
              state.themePreference === nextThemePreference
            ) {
              return state;
            }

            return {
              isDarkMode,
              themePreference: nextThemePreference,
            };
          }),
        setThemePreference: (themePreference: ThemePreference) =>
          set((state) => {
            const normalizedThemePreference = normalizeThemePreference(
              themePreference,
            );
            const nextIsDarkMode = resolveIsDarkMode(normalizedThemePreference);

            if (
              state.themePreference === normalizedThemePreference &&
              state.isDarkMode === nextIsDarkMode
            ) {
              return state;
            }

            return {
              themePreference: normalizedThemePreference,
              isDarkMode: nextIsDarkMode,
            };
          }),
        signOut: () =>
          set((state) => ({
            themePreference: normalizeThemePreference(state.themePreference),
            isDarkMode: resolveIsDarkMode(normalizeThemePreference(state.themePreference)),
            authBootstrapStatus: 'ready',
            authBootstrapError: null,
            session: null,
            preferredRole: 'viewer',
            preferredRoles: ['viewer'],
            unlockedDemoLiveIds: [],
            demoLiveChats: initialDemoLiveChats,
          })),
      };
      return store;
    });
  } else {
    // Native platform: use persist middleware
    const { createJSONStorage, persist } = require('zustand/middleware');
    const { fileStorage } = require('./persist-storage');

    return create<SessionState>()(
      persist(
        (set: any) => ({
          hydrated: false,
          authBootstrapStatus: 'idle',
          authBootstrapError: null,
          hasSeenOnboarding: false,
          preferredRole: 'viewer',
          preferredRoles: ['viewer'],
          session: null,
          unlockedDemoLiveIds: [],
          demoLiveChats: initialDemoLiveChats,
          isDarkMode: false,
          themePreference: 'system',
          setHydrated: (hydrated: boolean) => set({ hydrated }),
          setAuthBootstrapState: (authBootstrapStatus: SessionState['authBootstrapStatus'], authBootstrapError: string | null = null) =>
            set({ authBootstrapStatus, authBootstrapError }),
          completeOnboarding: () => set({ hasSeenOnboarding: true }),
          setPreferredRole: (preferredRole: UserRole) =>
            set((state: SessionState) => {
              const normalizedPreferredRole = normalizeUserRole(preferredRole);
              const normalizedPreferredRoles = normalizeUserRoles(state.preferredRoles, [
                normalizedPreferredRole,
              ]);

              return {
                preferredRole: normalizedPreferredRole,
                preferredRoles: normalizedPreferredRoles.includes(normalizedPreferredRole)
                  ? normalizedPreferredRoles
                  : [normalizedPreferredRole],
              };
            }),
          setPreferredRoles: (roles: UserRole[], activeRole?: UserRole) =>
            set(() => {
              const normalizedPreferredRoles = normalizeUserRoles(
                roles,
                [normalizeUserRole(activeRole)],
              );
              return {
                preferredRoles: normalizedPreferredRoles,
                preferredRole: normalizeUserRole(
                  activeRole,
                  normalizedPreferredRoles[0] ?? 'viewer',
                ),
              };
            }),
          setActiveRole: (role: UserRole) =>
            set((state: SessionState) => {
              const requestedRole = normalizeUserRole(role, state.preferredRole);
              const nextSession = switchSessionRole(state.session, requestedRole);
              const nextRole =
                nextSession?.activeRole ?? nextSession?.user.role ?? state.preferredRole;

              return {
                preferredRole: nextRole,
                session: nextSession,
              };
            }),
          setSession: (session: AuthSession | null) =>
            set((state: SessionState) => {
              const normalizedSession = sanitizeSession(
                session,
                state.preferredRoles,
                state.preferredRole,
              );

              return {
                authBootstrapError: null,
                session: normalizedSession,
                preferredRoles:
                  normalizedSession?.user.roles?.length
                    ? normalizedSession.user.roles
                    : state.preferredRoles,
                preferredRole: normalizedSession
                  ? normalizeUserRole(
                      normalizedSession.activeRole ?? normalizedSession.user.role,
                      normalizedSession.user.roles?.[0] ?? state.preferredRole,
                    )
                  : state.preferredRole,
              };
            }),
          unlockDemoLiveAccess: (liveId: string) =>
            set((state: SessionState) => ({
              unlockedDemoLiveIds: state.unlockedDemoLiveIds.includes(liveId)
                ? state.unlockedDemoLiveIds
                : [...state.unlockedDemoLiveIds, liveId],
            })),
          sendDemoLiveChatMessage: (liveId: string, message: Omit<DemoLiveChatMessage, 'id'>) =>
            set((state: SessionState) => ({
              demoLiveChats: {
                ...state.demoLiveChats,
                [liveId]: [
                  ...(state.demoLiveChats[liveId] ?? []),
                  { ...message, id: `${liveId}-${Date.now()}` },
                ],
              },
            })),
          resetDemoLiveChat: (liveId: string) =>
            set((state: SessionState) => ({
              demoLiveChats: {
                ...state.demoLiveChats,
                [liveId]: initialDemoLiveChats[liveId] ?? [],
              },
            })),
          setIsDarkMode: (isDarkMode: boolean) =>
            set((state: SessionState) => {
              const nextThemePreference = isDarkMode ? 'dark' : 'light';

              if (
                state.isDarkMode === isDarkMode &&
                state.themePreference === nextThemePreference
              ) {
                return state;
              }

              return {
                isDarkMode,
                themePreference: nextThemePreference,
              };
            }),
          setThemePreference: (themePreference: ThemePreference) =>
            set((state: SessionState) => {
              const normalizedThemePreference = normalizeThemePreference(
                themePreference,
              );
              const nextIsDarkMode = resolveIsDarkMode(normalizedThemePreference);

              if (
                state.themePreference === normalizedThemePreference &&
                state.isDarkMode === nextIsDarkMode
              ) {
                return state;
              }

              return {
                themePreference: normalizedThemePreference,
                isDarkMode: nextIsDarkMode,
              };
            }),
          signOut: () =>
            set((state: SessionState) => ({
              themePreference: normalizeThemePreference(state.themePreference),
              isDarkMode: resolveIsDarkMode(normalizeThemePreference(state.themePreference)),
              authBootstrapStatus: 'ready',
              authBootstrapError: null,
              session: null,
              preferredRole: 'viewer',
              preferredRoles: ['viewer'],
              unlockedDemoLiveIds: [],
              demoLiveChats: initialDemoLiveChats,
            })),
        }),
        {
          name: 'livegate-mobile-session',
          version: 2,
          migrate: (persistedState: unknown) =>
            sanitizePersistedState(persistedState as Partial<SessionState> | undefined),
          storage: createJSONStorage(() => fileStorage),
          partialize: (state: SessionState) => ({
            hasSeenOnboarding: state.hasSeenOnboarding,
            preferredRole: state.preferredRole,
            preferredRoles: state.preferredRoles,
            session: state.session,
            unlockedDemoLiveIds: state.unlockedDemoLiveIds,
            demoLiveChats: state.demoLiveChats,
            isDarkMode: state.isDarkMode,
            themePreference: state.themePreference,
          }),
          onRehydrateStorage: () => (state?: SessionState) => {
            if (state && typeof state.setHydrated === 'function') {
              state.setHydrated(true);
            }
          },
        },
      ),
    );
  }
};

export const useSessionStore = createStore();
