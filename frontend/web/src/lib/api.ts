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
  LiveChatMessageRecord,
  LiveRoomPayload,
  LiveSessionDetailPayload,
  NotificationRecord,
  ProfileSettingsPayload,
  PremiumContentDetailPayload,
  SaveProfileSettingsResponse,
  SearchFilters,
  SearchResultsPayload,
  TransactionRecord,
  UserRole,
  ViewerDashboardPayload,
} from './shared';
import { apiRoutes } from './shared';
import { http } from './http';

type AuthStateUpdateResponse = {
  accepted: boolean;
  message: string;
  user: AuthSession['user'];
  nextStep?: AuthSession['nextStep'];
};

type EmailVerificationDeliveryResponse = {
  accepted: boolean;
  message: string;
  verification?: {
    email: string;
    previewCode?: string;
  };
};

type PasswordResetDeliveryResponse = {
  accepted: boolean;
  message: string;
  reset?: {
    email: string;
    previewCode?: string;
  };
};

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

export const webApi = {
  signIn: (body: { identifier: string; password: string; role?: string; roles?: UserRole[] }) =>
    http<AuthSession>(apiRoutes.auth.signIn, {
      method: 'POST',
      body: {
        identifier: body.identifier,
        password: body.password,
      },
      authenticated: false,
    }),
  signUp: (body: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
    role: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'prefer_not_to_say' | 'custom';
    customGender?: string;
    country?: string;
  }) =>
    http<AuthSession>(apiRoutes.auth.signUp, {
      method: 'POST',
      body: {
        fullName: body.fullName,
        username: body.username,
        email: body.email,
        password: body.password,
        role: body.role,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        customGender: body.customGender,
        country: body.country,
      },
      authenticated: false,
    }),
  signInWithGoogle: (body: { idToken?: string; clerkToken?: string; role?: string; roles?: UserRole[] }) =>
    http<AuthSession>(apiRoutes.auth.signInWithGoogle, {
      method: 'POST',
      body: {
        idToken: body.idToken,
        clerkToken: body.clerkToken,
        role: body.role,
      },
      authenticated: false,
    }),
  refresh: (body: { refreshToken: string }) =>
    http<AuthSession>(apiRoutes.auth.refresh, { method: 'POST', body, authenticated: false }),
  logout: (body: { refreshToken: string }) =>
    http<{ message: string }>(apiRoutes.auth.logout, { method: 'POST', body }),
  requestEmailVerification: () =>
    http<EmailVerificationDeliveryResponse>(apiRoutes.auth.emailVerificationRequest, { method: 'POST', body: {} }),
  confirmEmailVerification: (body: { email: string; code: string }) =>
    http<AuthStateUpdateResponse>(apiRoutes.auth.emailVerificationConfirm, { method: 'POST', body, authenticated: false }),
  forgotPassword: (body: { email: string }) =>
    http<PasswordResetDeliveryResponse>(apiRoutes.auth.forgotPassword, {
      method: 'POST',
      body,
      authenticated: false,
    }),
  resetPassword: (body: { email: string; code: string; password: string }) =>
    http<{ message: string }>(apiRoutes.auth.resetPassword, {
      method: 'POST',
      body,
      authenticated: false,
    }),
  completeProfile: (body: { 
    fullName: string; 
    username: string; 
    dateOfBirth: string; 
    gender: string; 
    customGender?: string;
  }) =>
    http<AuthStateUpdateResponse>(apiRoutes.auth.completeProfile, { method: 'POST', body }),
  linkGoogleAccount: (body: { idToken?: string; clerkToken?: string }) =>
    http<AuthStateUpdateResponse>(apiRoutes.auth.linkGoogleAccount, { method: 'POST', body }),
  linkPassword: (body: { password: string }) =>
    http<AuthStateUpdateResponse>(apiRoutes.auth.linkPassword, { method: 'POST', body }),
  getHomeFeed: () => http<HomeFeedPayload>(apiRoutes.home, { authenticated: false }),
  getCategoryCatalog: () =>
    http<CategoryRecord[]>(apiRoutes.categories, { authenticated: false }),
  getCategoryDetail: (slug: string) =>
    http<CategoryDetailPayload>(apiRoutes.categoryDetail(slug), { authenticated: false }),
  getCreatorProfile: (id: string) =>
    http<CreatorProfilePayload>(apiRoutes.creatorDetail(id), { authenticated: false }),
  getLiveDetail: (id: string) =>
    http<LiveSessionDetailPayload>(apiRoutes.liveDetail(id), { authenticated: false }),
  getLiveRoom: (id: string) => http<LiveRoomPayload>(apiRoutes.liveRoom(id)),
  getLiveChatMessages: async (id: string, limit = 40) => {
    const messages = await http<
      Array<{
        id: string;
        body: string;
        status?: string;
        createdAt: string;
        senderId: string;
        sender?: {
          firstName?: string;
          lastName?: string;
          creatorProfile?: {
            displayName?: string | null;
          } | null;
        } | null;
      }>
    >(apiRoutes.liveChatHistory(id, limit));

    return messages.map<LiveChatMessageRecord>((message) => ({
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      authorName:
        message.sender?.creatorProfile?.displayName?.trim() ||
        `${message.sender?.firstName ?? ''} ${message.sender?.lastName ?? ''}`.trim() ||
        'Viewer',
      sentAt: message.createdAt,
      status: message.status,
    }));
  },
  recordLiveAttendance: (id: string, attendanceSeconds: number) =>
    http<{ updated: boolean }>(apiRoutes.liveAttendance(id), {
      method: 'POST',
      body: { attendanceSeconds },
    }),
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
  getProfileSettings: () => http<ProfileSettingsPayload>(apiRoutes.profileSettings),
  saveProfileSettings: (body: ProfileSettingsPayload) =>
    http<SaveProfileSettingsResponse>(apiRoutes.profileSettings, {
      method: 'PUT',
      body,
    }),
};
