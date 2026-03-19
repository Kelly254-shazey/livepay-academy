import type {
  AdminDashboardPayload,
  ApiListResponse,
  AuthSession,
  CategoryDetailPayload,
  ClassDetailPayload,
  CreatorDashboardPayload,
  CreatorProfilePayload,
  HomeFeedPayload,
  LiveRoomPayload,
  LiveSessionDetailPayload,
  NotificationRecord,
  PremiumContentDetailPayload,
  SearchFilters,
  SearchResultsPayload,
  ViewerDashboardPayload,
} from '@livegate/shared';
import { apiRoutes } from '@livegate/shared';
import { useSessionStore } from '@/store/session-store';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export class MobileApiError extends Error {}

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
  signIn: (body: { email: string; password: string; role: string }) =>
    request<AuthSession>(apiRoutes.auth.signIn, { method: 'POST', body, authenticated: false }),
  signUp: (body: { fullName: string; email: string; password: string; role: string }) =>
    request<AuthSession>(apiRoutes.auth.signUp, { method: 'POST', body, authenticated: false }),
  forgotPassword: (body: { email: string }) =>
    request<{ message: string }>(apiRoutes.auth.forgotPassword, {
      method: 'POST',
      body,
      authenticated: false,
    }),
  resetPassword: (body: { email: string; token: string; password: string }) =>
    request<{ message: string }>(apiRoutes.auth.resetPassword, {
      method: 'POST',
      body,
      authenticated: false,
    }),
  getHomeFeed: () => request<HomeFeedPayload>(apiRoutes.home, { authenticated: false }),
  getCategoryDetail: (slug: string) =>
    request<CategoryDetailPayload>(apiRoutes.categoryDetail(slug), { authenticated: false }),
  getCreatorProfile: (id: string) =>
    request<CreatorProfilePayload>(apiRoutes.creatorDetail(id), { authenticated: false }),
  getLiveDetail: (id: string) =>
    request<LiveSessionDetailPayload>(apiRoutes.liveDetail(id), { authenticated: false }),
  getLiveRoom: (id: string) => request<LiveRoomPayload>(apiRoutes.liveRoom(id)),
  getPremiumContentDetail: (id: string) =>
    request<PremiumContentDetailPayload>(apiRoutes.premiumContentDetail(id), {
      authenticated: false,
    }),
  getClassDetail: (id: string) =>
    request<ClassDetailPayload>(apiRoutes.classDetail(id), { authenticated: false }),
  getViewerDashboard: () => request<ViewerDashboardPayload>(apiRoutes.viewerDashboard),
  getCreatorDashboard: () => request<CreatorDashboardPayload>(apiRoutes.creatorDashboard),
  getAdminDashboard: () => request<AdminDashboardPayload>(apiRoutes.adminDashboard),
  getNotifications: () => request<ApiListResponse<NotificationRecord>>(apiRoutes.notifications),
  search: (filters: SearchFilters) => {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.type) params.set('type', filters.type);
    return request<SearchResultsPayload>(`${apiRoutes.search}?${params.toString()}`, {
      authenticated: false,
    });
  },
  requestPayout: (body: { amount: number; method: string; note?: string }) =>
    request<{ message: string }>(apiRoutes.creatorPayouts, { method: 'POST', body }),
};
