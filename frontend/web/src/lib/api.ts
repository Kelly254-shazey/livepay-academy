import type {
  AdminDashboardPayload,
  ApiListResponse,
  AuthSession,
  CategoryDetailPayload,
  CheckoutSummary,
  ClassDetailPayload,
  CreatorDashboardPayload,
  CreatorProfilePayload,
  HomeFeedPayload,
  LiveRoomPayload,
  LiveSessionDetailPayload,
  NotificationRecord,
  ProfileSettingsPayload,
  PremiumContentDetailPayload,
  SaveProfileSettingsResponse,
  SearchFilters,
  SearchResultsPayload,
  TransactionRecord,
  ViewerDashboardPayload,
} from '@livegate/shared';
import {
  apiRoutes,
  createDemoCheckout,
  forgotPasswordDemo,
  getDemoAdminDashboard,
  getDemoCategoryDetail,
  getDemoClassDetail,
  getDemoCreatorDashboard,
  getDemoCreatorProfile,
  getDemoHomeFeed,
  getDemoLiveDetail,
  getDemoLiveRoom,
  getDemoNotifications,
  getDemoProfileSettings,
  getDemoPremiumContentDetail,
  getDemoViewerDashboard,
  requestDemoPayout,
  resetPasswordDemo,
  saveDemoProfileSettings,
  searchDemo,
  signInWithDemo,
  signUpWithDemo,
  type UserRole,
} from '@livegate/shared';
import { http } from './http';
import { useSessionStore } from '@/store/session-store';

async function withDemoFallback<T>(run: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await run();
  } catch {
    return fallback();
  }
}

export const webApi = {
  signIn: (body: { email: string; password: string; role: string; roles?: UserRole[] }) =>
    withDemoFallback(
      () => http<AuthSession>(apiRoutes.auth.signIn, { method: 'POST', body, authenticated: false }),
      () => signInWithDemo({ ...body, activeRole: body.role as UserRole }),
    ),
  signUp: (body: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    roles?: UserRole[];
  }) =>
    withDemoFallback(
      () => http<AuthSession>(apiRoutes.auth.signUp, { method: 'POST', body, authenticated: false }),
      () => signUpWithDemo({ ...body, activeRole: body.role as UserRole }),
    ),
  forgotPassword: (body: { email: string }) =>
    withDemoFallback(() => http<{ message: string }>(apiRoutes.auth.forgotPassword, {
      method: 'POST',
      body,
      authenticated: false,
    }), forgotPasswordDemo),
  resetPassword: (body: { email: string; token: string; password: string }) =>
    withDemoFallback(() => http<{ message: string }>(apiRoutes.auth.resetPassword, {
      method: 'POST',
      body,
      authenticated: false,
    }), resetPasswordDemo),
  getHomeFeed: () =>
    withDemoFallback(() => http<HomeFeedPayload>(apiRoutes.home, { authenticated: false }), getDemoHomeFeed),
  getCategoryDetail: (slug: string) =>
    withDemoFallback(
      () => http<CategoryDetailPayload>(apiRoutes.categoryDetail(slug), { authenticated: false }),
      () => getDemoCategoryDetail(slug as never),
    ),
  getCreatorProfile: (id: string) =>
    withDemoFallback(
      () => http<CreatorProfilePayload>(apiRoutes.creatorDetail(id), { authenticated: false }),
      () => getDemoCreatorProfile(id),
    ),
  getLiveDetail: (id: string) =>
    withDemoFallback(
      () => http<LiveSessionDetailPayload>(apiRoutes.liveDetail(id), { authenticated: false }),
      () => getDemoLiveDetail(id),
    ),
  getLiveRoom: (id: string) =>
    withDemoFallback(() => http<LiveRoomPayload>(apiRoutes.liveRoom(id)), () => getDemoLiveRoom(id)),
  getPremiumContentDetail: (id: string) =>
    withDemoFallback(
      () =>
        http<PremiumContentDetailPayload>(apiRoutes.premiumContentDetail(id), {
          authenticated: false,
        }),
      () => getDemoPremiumContentDetail(id),
    ),
  getClassDetail: (id: string) =>
    withDemoFallback(
      () => http<ClassDetailPayload>(apiRoutes.classDetail(id), { authenticated: false }),
      () => getDemoClassDetail(id),
    ),
  getViewerDashboard: () =>
    withDemoFallback(() => http<ViewerDashboardPayload>(apiRoutes.viewerDashboard), getDemoViewerDashboard),
  getCreatorDashboard: () =>
    withDemoFallback(() => http<CreatorDashboardPayload>(apiRoutes.creatorDashboard), getDemoCreatorDashboard),
  getAdminDashboard: () =>
    withDemoFallback(() => http<AdminDashboardPayload>(apiRoutes.adminDashboard), getDemoAdminDashboard),
  getNotifications: () =>
    withDemoFallback(
      () => http<ApiListResponse<NotificationRecord>>(apiRoutes.notifications),
      getDemoNotifications,
    ),
  getTransactions: () =>
    withDemoFallback(
      () => http<ApiListResponse<TransactionRecord>>(apiRoutes.transactions),
      () => getDemoViewerDashboard().transactions,
    ),
  search: (filters: SearchFilters) => {
    const search = new URLSearchParams();

    if (filters.query) search.set('query', filters.query);
    if (filters.category) search.set('category', filters.category);
    if (filters.type) search.set('type', filters.type);

    return withDemoFallback(
      () =>
        http<SearchResultsPayload>(`${apiRoutes.search}?${search.toString()}`, {
          authenticated: false,
        }),
      () => searchDemo(filters),
    );
  },
  createCheckout: (body: { productId: string; productType: 'live' | 'content' | 'class' }) =>
    withDemoFallback(
      () => http<CheckoutSummary>(apiRoutes.checkout, { method: 'POST', body }),
      () => createDemoCheckout(body),
    ),
  requestPayout: (body: { amount: number; method: string; note?: string }) =>
    withDemoFallback(
      () => http<{ message: string }>(apiRoutes.creatorPayouts, { method: 'POST', body }),
      () => requestDemoPayout(body),
    ),
  getProfileSettings: () =>
    withDemoFallback(
      () => http<ProfileSettingsPayload>(apiRoutes.profileSettings),
      () => {
        const session = useSessionStore.getState().session;
        return getDemoProfileSettings({
          fullName: session?.user.fullName,
          email: session?.user.email,
          roles: session?.user.roles,
          activeRole: session?.user.role,
        });
      },
    ),
  saveProfileSettings: (body: ProfileSettingsPayload) =>
    withDemoFallback(
      () =>
        http<SaveProfileSettingsResponse>(apiRoutes.profileSettings, {
          method: 'PUT',
          body,
        }),
      () => saveDemoProfileSettings(body),
    ),
};
