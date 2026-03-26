function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

function isLocalhostHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

const injectedApiBaseUrl = stripTrailingSlash(__LIVEGATE_API_BASE_URL__ ?? '');
const injectedSocketUrl = stripTrailingSlash(__LIVEGATE_SOCKET_URL__ ?? '');
const injectedGoogleClientId = __LIVEGATE_GOOGLE_CLIENT_ID__ ?? '';

const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const runtimeHostname = typeof window !== 'undefined' ? window.location.hostname : '';
const demoQueryEnabled =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo');

// Demo fallback is useful for product walkthroughs, but should never silently take over real sessions in production.
export const demoFallbackEnabled = import.meta.env.DEV || demoQueryEnabled;

const defaultApiBaseUrl =
  !demoFallbackEnabled && runtimeOrigin && !isLocalhostHost(runtimeHostname)
    ? `${runtimeOrigin}/api`
    : '';

export const env = {
  apiBaseUrl: injectedApiBaseUrl || defaultApiBaseUrl,
  socketUrl: injectedSocketUrl,
  googleClientId: injectedGoogleClientId,
};

export const isApiConfigured = Boolean(env.apiBaseUrl);
export const isGoogleAuthConfigured = Boolean(env.googleClientId);
