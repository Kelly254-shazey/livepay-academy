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

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

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
