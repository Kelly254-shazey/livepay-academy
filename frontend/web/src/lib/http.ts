import { useSessionStore } from '@/store/session-store';
import { env, isApiConfigured } from './env';

export class ApiConfigurationError extends Error {
  constructor(message = 'API base URL is not configured.') {
    super(message);
    this.name = 'ApiConfigurationError';
  }
}

export class ApiRequestError extends Error {
  status?: number;
  details?: Record<string, string[]>;

  constructor(message: string, status?: number, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  authenticated?: boolean;
};

export async function http<T>(path: string, options: RequestOptions = {}) {
  if (!isApiConfigured) {
    throw new ApiConfigurationError('Set VITE_API_BASE_URL before using LiveGate web data flows.');
  }

  const token = useSessionStore.getState().session?.tokens.accessToken;
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.authenticated !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    const runtimeHostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const apiHost = (() => {
      try {
        return new URL(env.apiBaseUrl).hostname;
      } catch {
        return '';
      }
    })();

    const looksLikeLocalhost =
      apiHost === 'localhost' || apiHost === '127.0.0.1' || apiHost === '::1';

    if (looksLikeLocalhost && runtimeHostname && runtimeHostname !== 'localhost') {
      throw new ApiRequestError(
        'Backend URL is set to localhost, which will not work on other phones. Configure VITE_API_BASE_URL to your hosted backend (or deploy backend behind /api on the same domain).',
      );
    }

    throw new ApiRequestError(
      'LiveGate backend is unavailable. Start the backend services and try again.',
    );
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(
      json?.message ?? 'Request failed.',
      response.status,
      json?.details,
    );
  }

  return (json?.data ?? json) as T;
}
