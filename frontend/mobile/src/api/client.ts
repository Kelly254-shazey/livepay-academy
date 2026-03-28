/**
 * Mobile API Client
 * 
 * Security Features:
 * - SSRF protection with URL validation and IP range blocking
 * - Input sanitization for search parameters
 * - Path validation to prevent injection attacks
 * - Safe URL construction with proper validation
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type {
  AdminDashboardPayload,
  ApiListResponse,
  AuthSession,
  CategoryDetailPayload,
  CheckoutSummary,
  ConfirmPurchaseResponse,
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
  ViewerDashboardPayload,
} from '../shared';
import {
  apiRoutes,
  DEMO_PASSWORD,
  forgotPasswordDemo,
  getDemoAdminDashboard,
  getDemoCategoryDetail,
  getDemoClassDetail,
  getDemoCreatorProfile,
  getDemoHomeFeed,
  getDemoLiveDetail,
  getDemoPremiumContentDetail,
  resetPasswordDemo,
  searchDemo,
  signInWithDemo,
  signUpWithDemo,
  normalizeAuthSession,
  type UserRole,
} from '../shared';
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

// Security: Allowed domains for API requests (allowlist approach)
const ALLOWED_DOMAINS = [
  'localhost', // Development only
  '127.0.0.1', // Development only
  'livepay-academy.vercel.app', // Public production API proxy
  'livepay-academy-production.up.railway.app', // Production Railway backend
  // Add your production API domains here
  // 'api.livegate.com',
  // 'staging-api.livegate.com'
];

// Security: Validate and sanitize URLs to prevent SSRF attacks
function validateApiUrl(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    const hostname = url.hostname.toLowerCase();
    
    // In development, allow localhost
    if (__DEV__ || process.env.NODE_ENV === 'development') {
      if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
        return true;
      }
    }
    
    // Check against allowlist
    if (!ALLOWED_DOMAINS.includes(hostname)) {
      return false;
    }
    
    // Block private IP ranges (RFC 1918) even if somehow in allowlist
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);
      // Block private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      if (
        (a === 10) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 169 && b === 254) // Block AWS metadata service
      ) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

function sanitizePath(path: string): string {
  // Remove any protocol or hostname from path
  if (path.includes('://')) {
    throw new MobileApiError('Invalid path: protocol not allowed in API paths');
  }
  
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Remove any double slashes and normalize
  path = path.replace(/\/+/g, '/');
  
  return path;
}

function createClientRequestId() {
  return `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Security: Validate ID parameters to prevent injection
function validateId(id: string, paramName: string): string {
  if (!id || typeof id !== 'string') {
    throw new MobileApiError(`Invalid ${paramName}: must be a non-empty string`);
  }
  
  // Remove any potentially dangerous characters
  const sanitized = id.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 100);
  
  if (!sanitized || sanitized.length < 1) {
    throw new MobileApiError(`Invalid ${paramName}: contains invalid characters`);
  }
  
  return sanitized;
}

function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();

  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    const normalizedPath = url.pathname.replace(/\/+$/, '');

    if (!normalizedPath) {
      url.pathname = '/api';
    } else {
      url.pathname = normalizedPath;
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    return trimmed.replace(/\/$/, '');
  }
}

function normalizeOriginUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();

  if (!trimmed) {
    return '';
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

function isLocalHostname(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '::1'].includes(hostname.toLowerCase());
}

function getHostnameFromUrl(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return '';
  }
}

const DEFAULT_PRODUCTION_API_BASE_URL = 'https://livepay-academy.vercel.app/api';
const DEFAULT_PRODUCTION_SOCKET_ORIGIN = 'https://livepay-academy-production.up.railway.app';
const explicitApiBaseUrl = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL ?? '');
const explicitSocketOrigin = normalizeOriginUrl(process.env.EXPO_PUBLIC_SOCKET_URL ?? '');
const inferredApiBaseUrl = (() => {
  const host = resolveExpoHost();
  return host ? `http://${host}:3000/api` : '';
})();
const isDevelopmentRuntime = __DEV__ || process.env.NODE_ENV === 'development';
const explicitApiHostname = getHostnameFromUrl(explicitApiBaseUrl);

const apiBaseUrl =
  (!isDevelopmentRuntime && (!explicitApiBaseUrl || isLocalHostname(explicitApiHostname))
    ? DEFAULT_PRODUCTION_API_BASE_URL
    : explicitApiBaseUrl) ||
  (Platform.OS === 'web' ? '' : inferredApiBaseUrl);
const socketOrigin =
  (!isDevelopmentRuntime && (!explicitSocketOrigin || isLocalHostname(getHostnameFromUrl(explicitSocketOrigin)))
    ? DEFAULT_PRODUCTION_SOCKET_ORIGIN
    : explicitSocketOrigin) ||
  (apiBaseUrl ? new URL(apiBaseUrl).origin : '');

export class MobileApiError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'MobileApiError';
  }
}

let inFlightRefresh: Promise<string | null> | null = null;
const localApiProbeCache = new Map<string, Promise<boolean>>();

function getResponseErrorMessage(statusCode: number, fallback?: string | null) {
  if (fallback?.trim()) {
    return fallback;
  }

  if (statusCode === 401) {
    return 'Session expired. Sign in again.';
  }

  if (statusCode === 429) {
    return 'Too many requests. Wait a moment and try again.';
  }

  if ([502, 503, 504].includes(statusCode)) {
    return 'LiveGate backend is temporarily unavailable. Retry in a moment.';
  }

  if (statusCode >= 500) {
    return 'LiveGate backend failed to process the request. Retry in a moment.';
  }

  return 'Request failed.';
}

function getNetworkErrorMessage(parsedUrl: URL) {
  if (Platform.OS === 'web' && !isLocalHostname(parsedUrl.hostname)) {
    const browserOrigin =
      typeof window !== 'undefined' ? window.location.origin : 'this browser origin';

    return `Browser access to ${parsedUrl.origin} was blocked. Allow ${browserOrigin} in backend CORS or use the local Node API for Expo web development.`;
  }

  if (isDevelopmentRuntime && isLocalHostname(parsedUrl.hostname)) {
    return `Unable to reach the LiveGate backend at ${parsedUrl.origin}. Start the local Node API or update EXPO_PUBLIC_API_BASE_URL.`;
  }

  return 'Unable to reach the LiveGate backend. Check your connection and server status.';
}

async function isLiveGateLocalApiAvailable() {
  if (!apiBaseUrl || !isDevelopmentRuntime || Platform.OS !== 'web') {
    return true;
  }

  let originUrl: URL;
  try {
    originUrl = new URL(apiBaseUrl);
  } catch {
    return false;
  }

  if (!isLocalHostname(originUrl.hostname)) {
    return true;
  }

  const cacheKey = originUrl.origin;
  if (!localApiProbeCache.has(cacheKey)) {
    localApiProbeCache.set(
      cacheKey,
      (async () => {
        try {
          const healthUrl = new URL('/health', `${originUrl.origin}/`).toString();
          const response = await fetch(healthUrl, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(2500),
          });

          if (!response.ok) {
            return false;
          }

          const contentType = response.headers.get('content-type') ?? '';
          if (!contentType.includes('application/json')) {
            return false;
          }

          const payload = await response.json().catch(() => null);
          return Boolean(payload && typeof payload === 'object' && 'status' in payload && 'services' in payload);
        } catch {
          return false;
        }
      })(),
    );
  }

  return localApiProbeCache.get(cacheKey)!;
}

function shouldUseDemoFallback() {
  if (!isDevelopmentRuntime) {
    return false;
  }

  if (!apiBaseUrl) {
    return true;
  }

  try {
    return isLocalHostname(new URL(apiBaseUrl).hostname);
  } catch {
    return false;
  }
}

async function withDemoFallback<T>(run: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await run();
  } catch (error) {
    if (!shouldUseDemoFallback()) {
      throw error;
    }

    return fallback();
  }
}

// Security: Safe fetch wrapper with comprehensive SSRF protection
async function safeFetch(url: string, options: RequestInit): Promise<Response> {
  // Parse and validate the URL thoroughly
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new MobileApiError('Request blocked: Malformed URL');
  }
  
  // Protocol validation
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new MobileApiError('Request blocked: Invalid protocol');
  }
  
  // Hostname validation against allowlist
  const hostname = parsedUrl.hostname.toLowerCase();
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  
  if (isDevelopment && ['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    // Allow localhost in development
  } else if (!ALLOWED_DOMAINS.includes(hostname)) {
    throw new MobileApiError('Request blocked: Domain not in allowlist');
  }
  
  // IP range validation (additional security layer)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipv4Regex);
  if (ipMatch) {
    const [, a, b, c, d] = ipMatch.map(Number);
    // Block private ranges and metadata services
    if (
      (a === 10) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      (a === 127) // Additional localhost block
    ) {
      if (!isDevelopment || !['127.0.0.1'].includes(hostname)) {
        throw new MobileApiError('Request blocked: Private IP range');
      }
    }
  }
  
  // Port validation (block common internal service ports)
  const dangerousPorts = [22, 23, 25, 53, 110, 143, 993, 995, 1433, 3306, 5432, 6379, 27017];
  if (parsedUrl.port && dangerousPorts.includes(parseInt(parsedUrl.port))) {
    throw new MobileApiError('Request blocked: Dangerous port');
  }
  
  // Path validation
  if (parsedUrl.pathname.includes('..') || parsedUrl.pathname.includes('//')) {
    throw new MobileApiError('Request blocked: Invalid path');
  }
  
  // Additional security headers and options
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'LiveGate-Mobile/1.0',
    },
    redirect: 'error', // Prevent redirect-based SSRF
    signal: options.signal ?? AbortSignal.timeout(30000), // 30 second timeout
  };
  
  // Make the actual request with all validations passed
  try {
    return await fetch(parsedUrl.toString(), secureOptions);
  } catch (error) {
    throw new MobileApiError(getNetworkErrorMessage(parsedUrl));
  }
}

async function request<T>(
  path: string,
  options: Omit<RequestInit, 'body'> & {
    body?: unknown;
    authenticated?: boolean;
    retryOnAuthFailure?: boolean;
  } = {},
) {
  if (!apiBaseUrl) {
    throw new MobileApiError('Set EXPO_PUBLIC_API_BASE_URL before using the mobile app data layer.');
  }

  if (!(await isLiveGateLocalApiAvailable())) {
    const apiOrigin = getNodeApiOrigin() || apiBaseUrl;
    throw new MobileApiError(
      `Local LiveGate API not detected at ${apiOrigin}. That port is serving a different app or the Node backend is offline.`,
    );
  }

  // Security: Validate the base URL to prevent SSRF
  if (!validateApiUrl(apiBaseUrl)) {
    throw new MobileApiError('Invalid API base URL: blocked for security reasons');
  }

  // Security: Sanitize the path to prevent injection
  const sanitizedPath = sanitizePath(path);

  const token = useSessionStore.getState().session?.tokens.accessToken;
  const headers = new Headers(options.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (!headers.has('x-request-id')) {
    headers.set('x-request-id', createClientRequestId());
  }

  if (!headers.has('x-source-service')) {
    headers.set('x-source-service', 'mobile-app');
  }

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.authenticated !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Security: Construct URL safely
  const fullUrl = `${apiBaseUrl}${sanitizedPath}`;
  
  // Additional validation of the final URL
  try {
    new URL(fullUrl); // This will throw if URL is malformed
  } catch {
    throw new MobileApiError('Malformed request URL');
  }

  // Use secure fetch wrapper instead of direct fetch
  const response = await safeFetch(fullUrl, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const json = await response.json().catch(() => null);

  if (
    response.status === 401 &&
    options.authenticated !== false &&
    options.retryOnAuthFailure !== false
  ) {
    const refreshedAccessToken = await refreshStoredSession();

    if (refreshedAccessToken) {
      return request<T>(path, {
        ...options,
        retryOnAuthFailure: false,
      });
    }
  }

  if (!response.ok) {
    if (response.status === 401 && options.authenticated !== false) {
      throw new MobileApiError('Session expired. Sign in again.', response.status);
    }

    throw new MobileApiError(getResponseErrorMessage(response.status, json?.message), response.status);
  }

  return (json?.data ?? json) as T;
}

async function refreshStoredSession() {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = (async () => {
    const store = useSessionStore.getState();
    const refreshToken = store.session?.tokens.refreshToken;

    if (!refreshToken) {
      store.signOut();
      return null;
    }

    try {
      const refreshedSession = await request<AuthSession>(apiRoutes.auth.refresh, {
        method: 'POST',
        body: { refreshToken },
        authenticated: false,
        retryOnAuthFailure: false,
      });

      const normalizedSession = normalizeAuthSession(
        refreshedSession,
        store.preferredRoles,
        store.preferredRole,
      );

      store.setSession(normalizedSession);
      return normalizedSession.tokens.accessToken;
    } catch {
      store.signOut();
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

export const mobileApi = {
  signIn: (body: { identifier: string; password: string; role: string; roles?: UserRole[] }) =>
    withDemoFallback(
      () => request<AuthSession>(apiRoutes.auth.signIn, { method: 'POST', body, authenticated: false }),
      () =>
        signInWithDemo({
          email: body.identifier.includes('@') ? body.identifier : `${body.identifier}@demo.local`,
          activeRole: body.role as UserRole,
          roles: body.roles,
        }),
    ),
  signUp: (body: {
    fullName: string;
    email: string;
    password: string;
    username: string;
    dateOfBirth: string;
    gender: string;
    customGender?: string;
    role: string;
    roles?: UserRole[];
  }) =>
    withDemoFallback(
      () => request<AuthSession>(apiRoutes.auth.signUp, { method: 'POST', body, authenticated: false }),
      () => signUpWithDemo({ ...body, activeRole: body.role as UserRole }),
    ),
  signInWithGoogle: (body: { idToken: string; role?: string; roles?: UserRole[] }) =>
    withDemoFallback(
      () => request<AuthSession>(apiRoutes.auth.signInWithGoogle, { method: 'POST', body, authenticated: false }),
      () => signInWithDemo({ email: 'google@demo.local', activeRole: (body.role || 'viewer') as UserRole, roles: body.roles }),
    ),
  refresh: (body: { refreshToken: string }) =>
    withDemoFallback(
      () => request<AuthSession>(apiRoutes.auth.refresh, { method: 'POST', body, authenticated: false }),
      () => ({ tokens: { accessToken: 'demo', refreshToken: 'demo' }, user: { id: 'demo', email: 'demo@demo.local', fullName: 'Demo', role: 'viewer' as UserRole, roles: ['viewer'] as UserRole[] } } as never),
    ),
  getCurrentSession: () =>
    withDemoFallback(
      async () => {
        const currentTokens = useSessionStore.getState().session?.tokens;
        const currentSession = await request<AuthSession>(apiRoutes.auth.session);

        return {
          ...currentSession,
          tokens:
            currentSession.tokens?.accessToken || currentSession.tokens?.refreshToken
              ? currentSession.tokens
              : currentTokens ?? currentSession.tokens,
        };
      },
      async () => {
        const session = useSessionStore.getState().session;
        if (!session) {
          throw new MobileApiError('No active session.');
        }

        return session;
      },
    ),
  logout: (body: { refreshToken: string }) =>
    withDemoFallback(
      () => request<{ message: string }>(apiRoutes.auth.logout, { method: 'POST', body }),
      async () => ({ message: 'Logged out' }),
    ),
  requestEmailVerification: () =>
    withDemoFallback(
      () => request<{ message: string; maskedEmail: string }>(apiRoutes.auth.emailVerificationRequest, { method: 'POST', body: {} }),
      async () => ({ message: 'Code sent', maskedEmail: 'd***@demo.local' }),
    ),
  confirmEmailVerification: (body: { email: string; code: string }) =>
    withDemoFallback(
      () => request<AuthSession>(apiRoutes.auth.emailVerificationConfirm, { method: 'POST', body, authenticated: false }),
      () => signInWithDemo({ email: body.email, activeRole: 'viewer' as UserRole }) as never,
    ),
  forgotPassword: (body: { email: string }) =>
    withDemoFallback(
      () =>
        request<{ message: string; maskedEmail: string }>(apiRoutes.auth.forgotPassword, {
          method: 'POST',
          body,
          authenticated: false,
        }),
      () => forgotPasswordDemo(body),
    ),
  resetPassword: (body: { email: string; code: string; password: string }) =>
    withDemoFallback(
      () =>
        request<{ message: string }>(apiRoutes.auth.resetPassword, {
          method: 'POST',
          body,
          authenticated: false,
        }),
      () => resetPasswordDemo(body),
    ),
  completeProfile: (body: { 
    fullName: string; 
    username: string; 
    dateOfBirth: string; 
    gender: string; 
    customGender?: string;
  }) =>
    withDemoFallback(
      () => request<AuthSession>(apiRoutes.auth.completeProfile, { method: 'POST', body }),
      async () => {
        const session = useSessionStore.getState().session;
        return { 
          tokens: session?.tokens || { accessToken: 'demo', refreshToken: 'demo' }, 
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
      () => request<AuthSession>(apiRoutes.auth.linkGoogleAccount, { method: 'POST', body }),
      async () => {
        const session = useSessionStore.getState().session;
        return session as never;
      },
    ),
  linkPassword: (body: { password: string }) =>
    withDemoFallback(
      () => request<AuthSession>(apiRoutes.auth.linkPassword, { method: 'POST', body }),
      async () => {
        const session = useSessionStore.getState().session;
        return session as never;
      },
    ),
  getHomeFeed: () =>
    withDemoFallback(() => request<HomeFeedPayload>(apiRoutes.home, { authenticated: false }), getDemoHomeFeed),
  getCategoryDetail: (slug: string) =>
    withDemoFallback(
      () => {
        const validatedSlug = validateId(slug, 'category slug');
        return request<CategoryDetailPayload>(apiRoutes.categoryDetail(validatedSlug), { authenticated: false });
      },
      () => getDemoCategoryDetail(slug as never),
    ),
  getCreatorProfile: (id: string) =>
    withDemoFallback(
      () => {
        const validatedId = validateId(id, 'creator ID');
        return request<CreatorProfilePayload>(apiRoutes.creatorDetail(validatedId), { authenticated: false });
      },
      () => getDemoCreatorProfile(id),
    ),
  getLiveDetail: (id: string) =>
    withDemoFallback(
      () => {
        const validatedId = validateId(id, 'live session ID');
        return request<LiveSessionDetailPayload>(apiRoutes.liveDetail(validatedId));
      },
      () => {
        const demoDetail = getDemoLiveDetail(id);
        return {
          ...demoDetail,
          live: {
            ...demoDetail.live,
            accessGranted: demoDetail.live.price <= 0 ? demoDetail.live.accessGranted : false,
          },
        };
      },
    ),
  getLiveRoom: (id: string) => {
    const validatedId = validateId(id, 'live room ID');
    return request<LiveRoomPayload>(apiRoutes.liveRoom(validatedId));
  },
  getPremiumContentDetail: (id: string) =>
    withDemoFallback(
      () => {
        const validatedId = validateId(id, 'content ID');
        return request<PremiumContentDetailPayload>(apiRoutes.premiumContentDetail(validatedId), {
          authenticated: false,
        });
      },
      () => getDemoPremiumContentDetail(id),
    ),
  getClassDetail: (id: string) =>
    withDemoFallback(
      () => {
        const validatedId = validateId(id, 'class ID');
        return request<ClassDetailPayload>(apiRoutes.classDetail(validatedId), { authenticated: false });
      },
      () => getDemoClassDetail(id),
    ),
  getViewerDashboard: () => request<ViewerDashboardPayload>(apiRoutes.viewerDashboard),
  getCreatorDashboard: () => request<CreatorDashboardPayload>(apiRoutes.creatorDashboard),
  getAdminDashboard: () =>
    withDemoFallback(() => request<AdminDashboardPayload>(apiRoutes.adminDashboard), getDemoAdminDashboard),
  getNotifications: () => request<ApiListResponse<NotificationRecord>>(apiRoutes.notifications),
  markNotificationRead: (notificationId: string) =>
    request<{ updated: boolean }>(apiRoutes.notificationRead(validateId(notificationId, 'notification ID')), {
      method: 'POST',
      body: {},
    }),
  search: (filters: SearchFilters) => {
    const params = new URLSearchParams();
    // Security: Sanitize search parameters to prevent injection
    if (filters.query) {
      const sanitizedQuery = filters.query.trim().slice(0, 200); // Limit length
      if (sanitizedQuery) params.set('query', sanitizedQuery);
    }
    if (filters.category) {
      // Validate category against known values
      const sanitizedCategory = filters.category.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 50);
      if (sanitizedCategory) params.set('category', sanitizedCategory);
    }
    if (filters.type) {
      // Validate type against known values
      const allowedTypes = ['all', 'creator', 'live', 'content', 'class'];
      if (allowedTypes.includes(filters.type)) {
        params.set('type', filters.type);
      }
    }
    return withDemoFallback(
      () =>
        request<SearchResultsPayload>(`${apiRoutes.search}?${params.toString()}`, {
          authenticated: false,
        }),
      () => searchDemo(filters),
    );
  },
  createCheckout: (body: { productId: string; productType: 'live' | 'content' | 'class' }) => {
    const validatedProductId = validateId(body.productId, 'product ID');
    const allowedTypes = ['live', 'content', 'class'] as const;
    if (!allowedTypes.includes(body.productType)) {
      throw new MobileApiError('Invalid product type');
    }
    return request<CheckoutSummary>(apiRoutes.checkout, {
      method: 'POST',
      body: { ...body, productId: validatedProductId },
    });
  },
  requestPayout: (body: { amount: number; method: string; note?: string }) => {
    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0 || body.amount > 1000000) {
      throw new MobileApiError('Invalid payout amount: must be a positive number under 1,000,000');
    }
    if (!body.method || typeof body.method !== 'string' || body.method.length > 100) {
      throw new MobileApiError('Invalid payout method: must be a non-empty string under 100 characters');
    }
    const sanitizedMethod = body.method.replace(/[<>"'&]/g, '').trim();
    const sanitizedNote = body.note ? body.note.replace(/[<>"'&]/g, '').trim().slice(0, 500) : undefined;

    return request<{ message: string }>(apiRoutes.creatorPayouts, {
      method: 'POST',
      body: {
        amount: body.amount,
        method: sanitizedMethod,
        note: sanitizedNote,
      },
    });
  },
  confirmPurchase: (body: {
    targetType: 'live_session' | 'premium_content' | 'class';
    targetId: string;
    providerReference: string;
    idempotencyKey: string;
  }) =>
    request<ConfirmPurchaseResponse>(apiRoutes.accessConfirmPurchase, {
      method: 'POST',
      body,
    }),
  getAccessGrantStatus: (
    targetType: 'live_session' | 'premium_content' | 'class' | 'lesson' | 'private_live_invite',
    targetId: string,
  ) =>
    request<{ allowed: boolean }>(apiRoutes.accessGrantStatus(targetType, targetId)),
  getLiveChatMessages: (liveId: string, limit = 40) =>
    withDemoFallback(
      async () => {
        const messages = await request<
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
        >(apiRoutes.liveChatHistory(validateId(liveId, 'liveId'), limit));

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
      async () => [],
    ),
  recordLiveAttendance: (liveId: string, attendanceSeconds: number) =>
    withDemoFallback(
      () =>
        request<{ updated: boolean }>(apiRoutes.liveAttendance(validateId(liveId, 'liveId')), {
          method: 'POST',
          body: { attendanceSeconds },
        }),
      async () => ({ updated: true }),
    ),
  getProfileSettings: () => request<ProfileSettingsPayload>(apiRoutes.profileSettings),
  saveProfileSettings: (body: ProfileSettingsPayload) =>
    request<SaveProfileSettingsResponse>(apiRoutes.profileSettings, {
      method: 'PUT',
      body,
    }),
};

export function getNodeApiBaseUrl() {
  return apiBaseUrl;
}

export function getNodeApiOrigin() {
  if (!apiBaseUrl) {
    return '';
  }

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return '';
  }
}

export function getNodeSocketOrigin() {
  return socketOrigin;
}
