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
} from '../shared';
import {
  apiRoutes,
  DEMO_PASSWORD,
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
    throw new MobileApiError('Network request failed');
  }
}

async function request<T>(
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: unknown; authenticated?: boolean } = {},
) {
  if (!apiBaseUrl) {
    throw new MobileApiError('Set EXPO_PUBLIC_API_BASE_URL before using the mobile app data layer.');
  }

  // Security: Validate the base URL to prevent SSRF
  if (!validateApiUrl(apiBaseUrl)) {
    throw new MobileApiError('Invalid API base URL: blocked for security reasons');
  }

  // Security: Sanitize the path to prevent injection
  const sanitizedPath = sanitizePath(path);

  const token = useSessionStore.getState().session?.tokens.accessToken;
  const headers = new Headers(options.headers);

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
      () => signInWithDemo({ email: 'google@demo.local', password: 'demo', activeRole: (body.role || 'viewer') as UserRole, roles: body.roles }),
    ),
  refresh: (body: { refreshToken: string }) =>
    withDemoFallback(
      () => request<AuthSession>(apiRoutes.auth.refresh, { method: 'POST', body, authenticated: false }),
      () => ({ tokens: { accessToken: 'demo', refreshToken: 'demo' }, user: { id: 'demo', email: 'demo@demo.local', fullName: 'Demo', role: 'viewer' as UserRole, roles: ['viewer'] as UserRole[] } } as never),
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
      () => signInWithDemo({ email: body.email, password: DEMO_PASSWORD, activeRole: 'viewer' as UserRole }) as never,
    ),
  forgotPassword: (body: { email: string }) =>
    withDemoFallback(
      () =>
        request<{ message: string; maskedEmail: string }>(apiRoutes.auth.forgotPassword, {
          method: 'POST',
          body,
          authenticated: false,
        }),
      forgotPasswordDemo,
    ),
  resetPassword: (body: { email: string; code: string; password: string }) =>
    withDemoFallback(
      () =>
        request<{ message: string }>(apiRoutes.auth.resetPassword, {
          method: 'POST',
          body,
          authenticated: false,
        }),
      resetPasswordDemo,
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
        return request<LiveSessionDetailPayload>(apiRoutes.liveDetail(validatedId), { authenticated: false });
      },
      () => getDemoLiveDetail(id),
    ),
  getLiveRoom: (id: string) =>
    withDemoFallback(
      () => {
        const validatedId = validateId(id, 'live room ID');
        return request<LiveRoomPayload>(apiRoutes.liveRoom(validatedId));
      },
      () => getDemoLiveRoom(id)
    ),
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
  createCheckout: (body: { productId: string; productType: 'live' | 'content' | 'class' }) =>
    withDemoFallback(
      () => {
        const validatedProductId = validateId(body.productId, 'product ID');
        const allowedTypes = ['live', 'content', 'class'] as const;
        if (!allowedTypes.includes(body.productType)) {
          throw new MobileApiError('Invalid product type');
        }
        return request<CheckoutSummary>(apiRoutes.checkout, { 
          method: 'POST', 
          body: { ...body, productId: validatedProductId } 
        });
      },
      () => createDemoCheckout(body),
    ),
  requestPayout: (body: { amount: number; method: string; note?: string }) =>
    withDemoFallback(
      () => {
        // Validate payout request data
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
            note: sanitizedNote
          }
        });
      },
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
