import {
  normalizeAuthSession,
  switchSessionRole,
  type AuthSession,
  type UserRole,
} from '../shared';
import { create } from 'zustand';
import { Platform } from 'react-native';

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
  hasSeenOnboarding: boolean;
  preferredRole: UserRole;
  preferredRoles: UserRole[];
  session: AuthSession | null;
  unlockedDemoLiveIds: string[];
  demoLiveChats: Record<string, DemoLiveChatMessage[]>;
  isDarkMode: boolean;
  setHydrated: (hydrated: boolean) => void;
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
  signOut: () => void;
}

// Only use persist middleware on native platforms
const createStore = () => {
  if (Platform.OS === 'web') {
    // Web platform: skip persist middleware to avoid import.meta issues
    return create<SessionState>((set) => {
      const store: SessionState = {
        hydrated: true,
        hasSeenOnboarding: false,
        preferredRole: 'viewer',
        preferredRoles: ['viewer'],
        session: null,
        unlockedDemoLiveIds: [],
        demoLiveChats: initialDemoLiveChats,
        isDarkMode: false,
        setHydrated: (hydrated: boolean) => set({ hydrated }),
        completeOnboarding: () => set({ hasSeenOnboarding: true }),
        setPreferredRole: (preferredRole: UserRole) =>
          set((state) => ({
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
          set((state) => ({
            preferredRole: role,
            session: switchSessionRole(state.session, role),
          })),
        setSession: (session: AuthSession | null) =>
          set((state) => ({
            session:
              session === null
                ? null
                : normalizeAuthSession(session, state.preferredRoles, state.preferredRole),
          })),
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
        setIsDarkMode: (isDarkMode: boolean) => set({ isDarkMode }),
        signOut: () =>
          set({
            session: null,
            preferredRole: 'viewer',
            preferredRoles: ['viewer'],
            unlockedDemoLiveIds: [],
            demoLiveChats: initialDemoLiveChats,
            isDarkMode: false,
          }),
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
          hasSeenOnboarding: false,
          preferredRole: 'viewer',
          preferredRoles: ['viewer'],
          session: null,
          unlockedDemoLiveIds: [],
          demoLiveChats: initialDemoLiveChats,
          isDarkMode: false,
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
          setIsDarkMode: (isDarkMode: boolean) => set({ isDarkMode }),
          signOut: () =>
            set({
              session: null,
              preferredRole: 'viewer',
              preferredRoles: ['viewer'],
              unlockedDemoLiveIds: [],
              demoLiveChats: initialDemoLiveChats,
              isDarkMode: false,
            }),
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
            demoLiveChats: state.demoLiveChats,
            isDarkMode: state.isDarkMode,
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
