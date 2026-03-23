import type {
  AdminDashboardPayload,
  ApiListResponse,
  AuthSession,
  CategoryRecord,
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
  categories,
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

type CreateLiveSessionInput = {
  categorySlug: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  isPaid: boolean;
  visibility: 'public' | 'followers' | 'private';
  scheduledFor?: string;
  sessionType: 'audio' | 'video' | 'both';
  hostNotes?: string;
  status: 'draft' | 'published';
};

async function resolveCategoryId(categorySlug: string) {
  const catalog = await http<CategoryRecord[]>(apiRoutes.categories, { authenticated: false });
  const category = catalog.find((item) => item.slug === categorySlug);

  if (!category) {
    throw new Error('Selected category is unavailable. Refresh the page and try again.');
  }

  return category.id;
}

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
  signInWithGoogle: (body: { idToken: string; role?: string; roles?: UserRole[] }) =>
    withDemoFallback(
      () => http<AuthSession>(apiRoutes.auth.signInWithGoogle, { method: 'POST', body, authenticated: false }),
      () => signInWithDemo({ email: 'google@demo.local', password: 'demo', activeRole: (body.role || 'viewer') as UserRole, roles: body.roles }),
    ),
  refresh: (body: { refreshToken: string }) =>
    withDemoFallback(
      () => http<AuthSession>(apiRoutes.auth.refresh, { method: 'POST', body, authenticated: false }),
      () => ({ tokens: { accessToken: 'demo', refreshToken: 'demo' }, user: { id: 'demo', email: 'demo@demo.local', fullName: 'Demo', role: 'viewer' as UserRole, roles: ['viewer'] as UserRole[] } } as never),
    ),
  logout: (body: { refreshToken: string }) =>
    withDemoFallback(
      () => http<{ message: string }>(apiRoutes.auth.logout, { method: 'POST', body }),
      async () => ({ message: 'Logged out' }),
    ),
  requestEmailVerification: () =>
    withDemoFallback(
      () => http<{ message: string; maskedEmail: string }>(apiRoutes.auth.emailVerificationRequest, { method: 'POST', body: {} }),
      async () => ({ message: 'Code sent', maskedEmail: 'd***@demo.local' }),
    ),
  confirmEmailVerification: (body: { email: string; code: string }) =>
    withDemoFallback(
      () => http<AuthSession>(apiRoutes.auth.emailVerificationConfirm, { method: 'POST', body, authenticated: false }),
      () => signInWithDemo({ ...body, activeRole: 'viewer' as UserRole }) as never,
    ),
  forgotPassword: (body: { email: string }) =>
    withDemoFallback(() => http<{ message: string; maskedEmail: string }>(apiRoutes.auth.forgotPassword, {
      method: 'POST',
      body,
      authenticated: false,
    }), forgotPasswordDemo),
  resetPassword: (body: { email: string; code: string; password: string }) =>
    withDemoFallback(() => http<{ message: string }>(apiRoutes.auth.resetPassword, {
      method: 'POST',
      body,
      authenticated: false,
    }), resetPasswordDemo),
  completeProfile: (body: { 
    fullName: string; 
    username: string; 
    dateOfBirth: string; 
    gender: string; 
    customGender?: string;
  }) =>
    withDemoFallback(
      () => http<AuthSession>(apiRoutes.auth.completeProfile, { method: 'POST', body }),
      async () => {
        const session = useSessionStore.getState().session;
        return { 
          tokens: session?.tokens || { accessToken: 'demo', refreshToken: 'demo', expiresAt: new Date().toISOString(), refreshExpiresAt: new Date().toISOString() }, 
          user: { 
            ...session?.user, 
            ...body, 
            id: session?.user.id || 'demo',
            email: session?.user.email || 'demo@demo.local',
            role: session?.user.role || 'viewer',
            roles: session?.user.roles || ['viewer']
          } 
        } as never;
      },
    ),
  linkGoogleAccount: (body: { idToken: string }) =>
    withDemoFallback(
      () => http<AuthSession>(apiRoutes.auth.linkGoogleAccount, { method: 'POST', body }),
      async () => {
        const session = useSessionStore.getState().session;
        return session as never;
      },
    ),
  linkPassword: (body: { password: string }) =>
    withDemoFallback(
      () => http<AuthSession>(apiRoutes.auth.linkPassword, { method: 'POST', body }),
      async () => {
        const session = useSessionStore.getState().session;
        return session as never;
      },
    ),
  getHomeFeed: () =>
    withDemoFallback(() => http<HomeFeedPayload>(apiRoutes.home, { authenticated: false }), getDemoHomeFeed),
  getCategoryCatalog: () =>
    withDemoFallback(
      () => http<CategoryRecord[]>(apiRoutes.categories, { authenticated: false }),
      () =>
        categories.map((item) => ({
          id: item.slug,
          slug: item.slug,
          name: item.title,
          description: item.shortDescription,
          status: 'active' as const,
        })),
    ),
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
  createLiveSession: async (body: CreateLiveSessionInput) => {
    const categoryId = await resolveCategoryId(body.categorySlug);
    const created = await http<{ id: string; title: string; status: string }>(apiRoutes.lives, {
      method: 'POST',
      body: {
        categoryId,
        title: body.title,
        description: body.description,
        price: body.isPaid ? body.price : 0,
        currency: body.currency ?? 'USD',
        isPaid: body.isPaid,
        visibility: body.visibility === 'followers' ? 'followers_only' : body.visibility,
        scheduledFor: body.scheduledFor,
        roomMetadata: {
          sessionType: body.sessionType,
          hostNotes: body.hostNotes ? [body.hostNotes] : [],
        },
      },
    });

    if (body.status === 'published') {
      return http<{ id: string; title: string; status: string }>(apiRoutes.livePublish(created.id), {
        method: 'POST',
      });
    }

    return created;
  },
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
