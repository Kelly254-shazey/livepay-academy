import Constants from 'expo-constants';
import { Platform } from 'react-native';
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
import { useSessionStore } from '@/store/session-store';

function resolveExpoHost() {
  const hostUri = Constants.expoConfig?.hostUri;

  if (!hostUri) {
    return '';
  }

  return hostUri
    .replace(/^[a-z]+:\/\//i, '')
    .split(':')[0]
    ?.trim();
}

const explicitApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
const inferredApiBaseUrl = (() => {
  const host = resolveExpoHost();
  return host ? `http://${host}:3000/api` : '';
})();

const apiBaseUrl =
  explicitApiBaseUrl ||
  (Platform.OS === 'web' ? '' : inferredApiBaseUrl);

export class MobileApiError extends Error {}

async function withDemoFallback<T>(run: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await run();
  } catch {
    return fallback();
  }
}

async function request<T>(
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: unknown; authenticated?: boolean } = {},
) {
  if (!apiBaseUrl) {
    throw new MobileApiError('Set EXPO_PUBLIC_API_BASE_URL before using the mobile app data layer.');
  }

  const token = useSessionStore.getState().session?.tokens.accessToken;
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.authenticated !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new MobileApiError(json?.message ?? 'Request failed.');
  }

  return (json?.data ?? json) as T;
}

export const mobileApi = {
  signIn: (body: { email: string; password: string; role: string; roles?: UserRole[] }) =>
    withDemoFallback(
      () => request<AuthSession>(apiRoutes.auth.signIn, { method: 'POST', body, authenticated: false }),
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
      () => request<AuthSession>(apiRoutes.auth.signUp, { method: 'POST', body, authenticated: false }),
      () => signUpWithDemo({ ...body, activeRole: body.role as UserRole }),
    ),
  forgotPassword: (body: { email: string }) =>
    withDemoFallback(
      () =>
        request<{ message: string }>(apiRoutes.auth.forgotPassword, {
          method: 'POST',
          body,
          authenticated: false,
        }),
      forgotPasswordDemo,
    ),
  resetPassword: (body: { email: string; token: string; password: string }) =>
    withDemoFallback(
      () =>
        request<{ message: string }>(apiRoutes.auth.resetPassword, {
          method: 'POST',
          body,
          authenticated: false,
        }),
      resetPasswordDemo,
    ),
  getHomeFeed: () =>
    withDemoFallback(() => request<HomeFeedPayload>(apiRoutes.home, { authenticated: false }), getDemoHomeFeed),
  getCategoryDetail: (slug: string) =>
    withDemoFallback(
      () => request<CategoryDetailPayload>(apiRoutes.categoryDetail(slug), { authenticated: false }),
      () => getDemoCategoryDetail(slug as never),
    ),
  getCreatorProfile: (id: string) =>
    withDemoFallback(
      () => request<CreatorProfilePayload>(apiRoutes.creatorDetail(id), { authenticated: false }),
      () => getDemoCreatorProfile(id),
    ),
  getLiveDetail: (id: string) =>
    withDemoFallback(
      () => request<LiveSessionDetailPayload>(apiRoutes.liveDetail(id), { authenticated: false }),
      () => getDemoLiveDetail(id),
    ),
  getLiveRoom: (id: string) =>
    withDemoFallback(() => request<LiveRoomPayload>(apiRoutes.liveRoom(id)), () => getDemoLiveRoom(id)),
  getPremiumContentDetail: (id: string) =>
    withDemoFallback(
      () =>
        request<PremiumContentDetailPayload>(apiRoutes.premiumContentDetail(id), {
          authenticated: false,
        }),
      () => getDemoPremiumContentDetail(id),
    ),
  getClassDetail: (id: string) =>
    withDemoFallback(
      () => request<ClassDetailPayload>(apiRoutes.classDetail(id), { authenticated: false }),
      () => getDemoClassDetail(id),
    ),
  getViewerDashboard: () =>
    withDemoFallback(() => request<ViewerDashboardPayload>(apiRoutes.viewerDashboard), getDemoViewerDashboard),
  getCreatorDashboard: () =>
    withDemoFallback(() => request<CreatorDashboardPayload>(apiRoutes.creatorDashboard), getDemoCreatorDashboard),
  getAdminDashboard: () =>
    withDemoFallback(() => request<AdminDashboardPayload>(apiRoutes.adminDashboard), getDemoAdminDashboard),
  getNotifications: () =>
    withDemoFallback(() => request<ApiListResponse<NotificationRecord>>(apiRoutes.notifications), getDemoNotifications),
  search: (filters: SearchFilters) => {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.type) params.set('type', filters.type);
    return withDemoFallback(
      () =>
        request<SearchResultsPayload>(`${apiRoutes.search}?${params.toString()}`, {
          authenticated: false,
        }),
      () => searchDemo(filters),
    );
  },
  createCheckout: (body: { productId: string; productType: 'live' | 'content' | 'class' }) =>
    withDemoFallback(
      () => request<CheckoutSummary>(apiRoutes.checkout, { method: 'POST', body }),
      () => createDemoCheckout(body),
    ),
  requestPayout: (body: { amount: number; method: string; note?: string }) =>
    withDemoFallback(
      () => request<{ message: string }>(apiRoutes.creatorPayouts, { method: 'POST', body }),
      () => requestDemoPayout(body),
    ),
  getProfileSettings: () =>
    withDemoFallback(
      () => request<ProfileSettingsPayload>(apiRoutes.profileSettings),
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
        request<SaveProfileSettingsResponse>(apiRoutes.profileSettings, {
          method: 'PUT',
          body,
        }),
      () => saveDemoProfileSettings(body),
    ),
};
