export const env = {
  apiBaseUrl: __LIVEGATE_API_BASE_URL__,
  socketUrl: __LIVEGATE_SOCKET_URL__,
};

export const isApiConfigured = Boolean(env.apiBaseUrl);
