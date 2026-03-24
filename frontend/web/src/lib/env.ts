export const env = {
  apiBaseUrl: __LIVEGATE_API_BASE_URL__,
  socketUrl: __LIVEGATE_SOCKET_URL__,
  googleClientId: __LIVEGATE_GOOGLE_CLIENT_ID__,
};

export const isApiConfigured = Boolean(env.apiBaseUrl);
export const isGoogleAuthConfigured = Boolean(env.googleClientId);
