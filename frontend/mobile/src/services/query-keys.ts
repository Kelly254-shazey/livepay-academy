export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  viewer: {
    home: ['viewer', 'home'] as const,
    dashboard: ['viewer', 'dashboard'] as const,
    notifications: ['viewer', 'notifications'] as const,
    transactions: ['viewer', 'transactions'] as const,
    search: (query: string, type: string) => ['viewer', 'search', query, type] as const,
    category: (slug: string) => ['viewer', 'category', slug] as const,
    creator: (creatorId: string) => ['viewer', 'creator', creatorId] as const,
    live: (liveId: string) => ['viewer', 'live', liveId] as const,
    liveRoom: (liveId: string) => ['viewer', 'live-room', liveId] as const,
    liveChat: (liveId: string) => ['viewer', 'live-chat', liveId] as const,
    content: (contentId: string) => ['viewer', 'content', contentId] as const,
    classItem: (classId: string) => ['viewer', 'class', classId] as const,
    checkout: (productId: string, productType: string) =>
      ['viewer', 'checkout', productType, productId] as const,
  },
  creator: {
    dashboard: ['creator', 'dashboard'] as const,
    home: ['creator', 'home'] as const,
    lives: ['creator', 'lives'] as const,
    library: ['creator', 'library'] as const,
    notifications: ['creator', 'notifications'] as const,
    payouts: ['creator', 'payouts'] as const,
  },
  profile: {
    settings: ['profile', 'settings'] as const,
  },
  staff: {
    dashboard: ['staff', 'dashboard'] as const,
  },
};
