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
  PremiumContentDetailPayload,
  SearchFilters,
  SearchResultsPayload,
  TransactionRecord,
  ViewerDashboardPayload,
} from '@livegate/shared';
import { apiRoutes } from '@livegate/shared';
import { http } from './http';

export const webApi = {
  signIn: (body: { email: string; password: string; role: string }) =>
    http<AuthSession>(apiRoutes.auth.signIn, { method: 'POST', body, authenticated: false }),
  signUp: (body: { fullName: string; email: string; password: string; role: string }) =>
    http<AuthSession>(apiRoutes.auth.signUp, { method: 'POST', body, authenticated: false }),
  forgotPassword: (body: { email: string }) =>
    http<{ message: string }>(apiRoutes.auth.forgotPassword, {
      method: 'POST',
      body,
      authenticated: false,
    }),
  resetPassword: (body: { email: string; token: string; password: string }) =>
    http<{ message: string }>(apiRoutes.auth.resetPassword, {
      method: 'POST',
      body,
      authenticated: false,
    }),
  getHomeFeed: () => http<HomeFeedPayload>(apiRoutes.home, { authenticated: false }),
  getCategoryDetail: (slug: string) =>
    http<CategoryDetailPayload>(apiRoutes.categoryDetail(slug), { authenticated: false }),
  getCreatorProfile: (id: string) =>
    http<CreatorProfilePayload>(apiRoutes.creatorDetail(id), { authenticated: false }),
  getLiveDetail: (id: string) =>
    http<LiveSessionDetailPayload>(apiRoutes.liveDetail(id), { authenticated: false }),
  getLiveRoom: (id: string) => http<LiveRoomPayload>(apiRoutes.liveRoom(id)),
  getPremiumContentDetail: (id: string) =>
    http<PremiumContentDetailPayload>(apiRoutes.premiumContentDetail(id), {
      authenticated: false,
    }),
  getClassDetail: (id: string) =>
    http<ClassDetailPayload>(apiRoutes.classDetail(id), { authenticated: false }),
  getViewerDashboard: () => http<ViewerDashboardPayload>(apiRoutes.viewerDashboard),
  getCreatorDashboard: () => http<CreatorDashboardPayload>(apiRoutes.creatorDashboard),
  getAdminDashboard: () => http<AdminDashboardPayload>(apiRoutes.adminDashboard),
  getNotifications: () =>
    http<ApiListResponse<NotificationRecord>>(apiRoutes.notifications),
  getTransactions: () =>
    http<ApiListResponse<TransactionRecord>>(apiRoutes.transactions),
  search: (filters: SearchFilters) => {
    const search = new URLSearchParams();

    if (filters.query) search.set('query', filters.query);
    if (filters.category) search.set('category', filters.category);
    if (filters.type) search.set('type', filters.type);

    return http<SearchResultsPayload>(`${apiRoutes.search}?${search.toString()}`, {
      authenticated: false,
    });
  },
  createCheckout: (body: { productId: string; productType: 'live' | 'content' | 'class' }) =>
    http<CheckoutSummary>(apiRoutes.checkout, { method: 'POST', body }),
  requestPayout: (body: { amount: number; method: string; note?: string }) =>
    http<{ message: string }>(apiRoutes.creatorPayouts, { method: 'POST', body }),
};
