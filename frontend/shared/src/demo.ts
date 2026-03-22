import { categories, type CategorySlug } from './catalog';
import { calculateCommission, calculateCreatorNet } from './format';
import type {
  AdminDashboardPayload,
  ApiListResponse,
  AuthSession,
  CategoryDetailPayload,
  CheckoutSummary,
  ClassDetailPayload,
  ClassSummary,
  CreatorDashboardPayload,
  CreatorProfilePayload,
  CreatorReview,
  CreatorSummary,
  DemoParticipant,
  HomeFeedPayload,
  LiveRoomPayload,
  LiveSessionDetailPayload,
  LiveSessionSummary,
  NotificationRecord,
  ManagedContentRecord,
  ProfileSettingsPayload,
  PremiumContentDetailPayload,
  PremiumContentSummary,
  SaveProfileSettingsResponse,
  SearchFilters,
  SearchResultsPayload,
  TransactionRecord,
  UserRole,
  ViewerDashboardPayload,
  WalletSummary,
} from './contracts';
import { normalizeAuthSession } from './identity';

export const DEMO_PASSWORD = 'Demo@12345';
export const DEMO_LIVE_ACCESS_CODE = '12345';
export const DEFAULT_VIEWER_ENTRY_LIVE_ID = 'live-nairobi-city-lights';
const now = '2026-03-21T09:00:00.000Z';

const creators: CreatorSummary[] = [
  {
    id: 'creator-ava',
    displayName: 'Ava Skyline',
    handle: 'ava.cityscope',
    headline: 'City-stream host capturing skyline shifts, nightlife, and urban rhythm in real time.',
    bio: 'Hosts paid live city windows, premium replay packs, and guided walkthrough sessions for viewers who love urban storytelling.',
    verificationStatus: 'verified',
    rating: 4.9,
    followerCount: 12400,
    reviewCount: 194,
    categories: ['entertainment-live', 'premium-tutorials'],
  },
  {
    id: 'creator-jonah',
    displayName: 'Jonah Streets',
    handle: 'jonah.afterdark',
    headline: 'Street-documentary host focused on neon districts, crowd energy, and late-night city culture.',
    bio: 'Runs immersive city streams, after-dark replays, and premium route breakdowns for travel-curious viewers.',
    verificationStatus: 'verified',
    rating: 4.8,
    followerCount: 9100,
    reviewCount: 122,
    categories: ['entertainment-live', 'creative-skills'],
  },
  {
    id: 'creator-sanaa',
    displayName: 'Sanaa Ocean',
    handle: 'sanaa.blueworld',
    headline: 'Marine-life streamer sharing coral reefs, open-water dives, and calm underwater scenes.',
    bio: 'Teaches viewers through premium marine streams, underwater replays, and guided ocean discovery sessions.',
    verificationStatus: 'pending',
    rating: 4.7,
    followerCount: 6800,
    reviewCount: 88,
    categories: ['entertainment-live', 'education'],
  },
];

const liveSessions: LiveSessionSummary[] = [
  {
    id: 'live-nairobi-city-lights',
    title: 'Nairobi City Lights Live',
    description: 'Ava streams skyline color shifts, rooftop views, and the pulse of Nairobi after sunset.',
    creator: creators[0],
    category: 'entertainment-live',
    price: 12,
    startTime: '2026-03-22T13:30:00.000Z',
    isLive: true,
    viewerCount: 286,
    accessGranted: false,
  },
  {
    id: 'live-tokyo-after-dark',
    title: 'Tokyo After Dark Street Feed',
    description: 'Jonah walks busy neon corridors, hidden side streets, and late-night city corners in one continuous stream.',
    creator: creators[1],
    category: 'entertainment-live',
    price: 14,
    startTime: '2026-03-24T17:00:00.000Z',
    isLive: false,
    viewerCount: 142,
    accessGranted: true,
  },
  {
    id: 'live-coral-reef-window',
    title: 'Coral Reef Window',
    description: 'Sanaa broadcasts a slow marine-life dive with reef fish, coral movement, and open-water calm.',
    creator: creators[2],
    category: 'education',
    price: 10,
    startTime: '2026-03-25T06:00:00.000Z',
    isLive: false,
    viewerCount: 94,
    accessGranted: false,
  },
];

const premiumContent: PremiumContentSummary[] = [
  {
    id: 'content-city-guide',
    title: 'City Night Replay Pack',
    description: 'A premium replay set with rooftop cuts, skyline notes, and favorite urban camera angles.',
    creator: creators[0],
    category: 'premium-tutorials',
    price: 19,
    accessGranted: true,
    attachmentCount: 6,
  },
  {
    id: 'content-street-route-pack',
    title: 'After Dark Route Pack',
    description: 'A premium set of city-stream highlights, route notes, and late-night visual checkpoints.',
    creator: creators[1],
    category: 'creative-skills',
    price: 24,
    accessGranted: false,
    attachmentCount: 4,
  },
  {
    id: 'content-reef-notes',
    title: 'Marine Life Field Notes',
    description: 'A guided underwater replay pack with reef highlights, species notes, and calm ambient loops.',
    creator: creators[2],
    category: 'education',
    price: 18,
    accessGranted: false,
    attachmentCount: 3,
  },
];

const classes: ClassSummary[] = [
  {
    id: 'class-market-cohort',
    title: 'City Storytelling Lab',
    description: 'A four-week class on filming city atmosphere, movement, and immersive urban narratives.',
    creator: creators[0],
    category: 'trading-education',
    price: 180,
    scheduleLabel: 'Starts March 29, Tuesdays and Thursdays',
    materials: ['Shot list pack', 'Replay vault', 'Urban scene workbook'],
    lessons: [
      { id: 'lesson-1', title: 'Reading the skyline', durationLabel: '42 min', accessGranted: true },
      { id: 'lesson-2', title: 'Capturing crowd motion', durationLabel: '51 min', accessGranted: true },
      { id: 'lesson-3', title: 'Editing urban atmosphere', durationLabel: '48 min', accessGranted: false },
    ],
    accessGranted: true,
  },
  {
    id: 'class-offer-lab',
    title: 'Marine Observation Basics',
    description: 'A content creator class focused on underwater observation, marine behavior, and calm visual storytelling.',
    creator: creators[1],
    category: 'business-entrepreneurship',
    price: 240,
    scheduleLabel: 'Starts April 2, live Saturdays',
    materials: ['Species worksheet', 'Dive replay set', 'Observation guide'],
    lessons: [
      { id: 'lesson-4', title: 'Reading reef patterns', durationLabel: '55 min', accessGranted: false },
      { id: 'lesson-5', title: 'Noticing species behavior', durationLabel: '46 min', accessGranted: false },
    ],
    accessGranted: false,
  },
];

const reviews: CreatorReview[] = [
  {
    id: 'review-1',
    authorName: 'Lina M.',
    rating: 5,
    comment: 'Ava turns ordinary city views into something cinematic. The live sessions feel immersive.',
    createdAt: now,
  },
  {
    id: 'review-2',
    authorName: 'David O.',
    rating: 5,
    comment: 'Jonah makes after-dark city streaming feel curated instead of chaotic.',
    createdAt: now,
  },
  {
    id: 'review-3',
    authorName: 'Mira K.',
    rating: 4,
    comment: "Sanaa's marine sessions are calm, beautiful, and easy to stay in for a long time.",
    createdAt: now,
  },
];

const viewerTransactions: TransactionRecord[] = [
  {
    id: 'txn-1',
    type: 'purchase',
    title: 'City Storytelling Lab',
    amount: 180,
    currency: 'USD',
    status: 'paid',
    createdAt: now,
    counterparty: creators[0].displayName,
  },
  {
    id: 'txn-2',
    type: 'purchase',
    title: 'Momentum Trading Playbook',
    amount: 39,
    currency: 'USD',
    status: 'paid',
    createdAt: now,
    counterparty: creators[0].displayName,
  },
];

const creatorTransactions: TransactionRecord[] = [
  {
    id: 'txn-3',
    type: 'earning',
    title: 'New York Open Market Breakdown',
    amount: 540,
    currency: 'USD',
    status: 'paid',
    createdAt: now,
  },
  {
    id: 'txn-4',
    type: 'payout',
    title: 'Weekly creator payout',
    amount: 820,
    currency: 'USD',
    status: 'paid',
    createdAt: now,
  },
];

const notifications: NotificationRecord[] = [
  {
    id: 'notif-1',
    type: 'live-reminder',
    title: 'Your live starts in 45 minutes',
    body: 'Nairobi City Lights Live is about to begin.',
    createdAt: now,
    read: false,
  },
  {
    id: 'notif-2',
    type: 'purchase',
    title: 'Access unlocked',
    body: 'You now have access to the City Night Replay Pack.',
    createdAt: now,
    read: false,
  },
  {
    id: 'notif-3',
    type: 'announcement',
    title: 'Jonah scheduled a new stream',
    body: 'A new after-dark city stream was published in your followed content creators feed.',
    createdAt: now,
    read: true,
  },
];

const creatorWallet: WalletSummary = {
  availableBalance: 1840,
  pendingBalance: 420,
  lifetimeEarnings: 12940,
  currency: 'USD',
};

const managedContent: ManagedContentRecord[] = [
  {
    id: liveSessions[0].id,
    kind: 'live',
    title: liveSessions[0].title,
    price: liveSessions[0].price,
    currency: 'USD',
    status: liveSessions[0].isLive ? 'live' : 'scheduled',
    category: liveSessions[0].category,
    creatorName: liveSessions[0].creator.displayName,
    createdAt: '2026-03-20T09:30:00.000Z',
    scheduleLabel: 'Starts Mar 22, 2026',
    deliveryLabel: 'Video live',
  },
  {
    id: liveSessions[1].id,
    kind: 'live',
    title: liveSessions[1].title,
    price: liveSessions[1].price,
    currency: 'USD',
    status: 'scheduled',
    category: liveSessions[1].category,
    creatorName: liveSessions[1].creator.displayName,
    createdAt: '2026-03-19T14:00:00.000Z',
    scheduleLabel: 'Starts Mar 24, 2026',
    deliveryLabel: 'Audio live',
  },
  {
    id: premiumContent[0].id,
    kind: 'content',
    title: premiumContent[0].title,
    price: premiumContent[0].price,
    currency: 'USD',
    status: 'published',
    category: premiumContent[0].category,
    creatorName: premiumContent[0].creator.displayName,
    createdAt: '2026-03-18T11:00:00.000Z',
    deliveryLabel: 'Video content',
  },
  {
    id: premiumContent[2].id,
    kind: 'content',
    title: premiumContent[2].title,
    price: premiumContent[2].price,
    currency: 'USD',
    status: 'published',
    category: premiumContent[2].category,
    creatorName: premiumContent[2].creator.displayName,
    createdAt: '2026-03-17T08:45:00.000Z',
    deliveryLabel: 'Audio content',
  },
  {
    id: classes[0].id,
    kind: 'class',
    title: classes[0].title,
    price: classes[0].price,
    currency: 'USD',
    status: 'published',
    category: classes[0].category,
    creatorName: classes[0].creator.displayName,
    createdAt: '2026-03-16T10:15:00.000Z',
    scheduleLabel: classes[0].scheduleLabel,
    deliveryLabel: 'Structured class',
  },
];

export const demoParticipants: DemoParticipant[] = [
  {
    id: 'demo-viewer',
    audience: 'public',
    fullName: 'Nadia Learner',
    email: 'viewer@demo.livegate.app',
    password: DEMO_PASSWORD,
    title: 'Premium learner',
    roleLabel: 'Viewer account',
    roles: ['viewer'],
    defaultRole: 'viewer',
    summary: 'A viewer account with paid content, joined lives, and library history.',
  },
  {
    id: 'demo-creator',
    audience: 'public',
    fullName: 'Miles Host',
    email: 'creator@demo.livegate.app',
    password: DEMO_PASSWORD,
    title: 'Monetizing creator',
    roleLabel: 'Creator account',
    roles: ['creator'],
    defaultRole: 'creator',
    summary: 'A creator account with earnings, payouts, and monetized inventory.',
  },
  {
    id: 'demo-hybrid',
    audience: 'public',
    fullName: 'Taylor Hybrid',
    email: 'hybrid@demo.livegate.app',
    password: DEMO_PASSWORD,
    title: 'Hybrid operator',
    roleLabel: 'Viewer + creator account',
    roles: ['viewer', 'creator'],
    defaultRole: 'viewer',
    summary: 'One account that can switch between audience and creator workflows.',
  },
  {
    id: 'demo-moderator',
    audience: 'staff',
    fullName: 'Noah Ops',
    email: 'moderator@demo.livegate.app',
    password: DEMO_PASSWORD,
    title: 'Moderation console',
    roleLabel: 'Moderator access',
    roles: ['moderator'],
    defaultRole: 'moderator',
    summary: 'A staff account centered on platform health, reports, and moderation.',
  },
  {
    id: 'demo-admin',
    audience: 'staff',
    fullName: 'Ava Control',
    email: 'admin@demo.livegate.app',
    password: DEMO_PASSWORD,
    title: 'Platform control room',
    roleLabel: 'Admin access',
    roles: ['admin'],
    defaultRole: 'admin',
    summary: 'A staff account with platform metrics, approvals, and financial oversight.',
  },
];

function listResponse<T>(items: T[]): ApiListResponse<T> {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: items.length,
  };
}

function findParticipant(email: string) {
  return demoParticipants.find((participant) => participant.email.toLowerCase() === email.trim().toLowerCase());
}

function createDemoSettings(input?: {
  fullName?: string;
  email?: string;
  roles?: UserRole[];
  activeRole?: UserRole;
}): ProfileSettingsPayload {
  const roles: UserRole[] = input?.roles?.length ? input.roles : ['viewer'];
  const defaultRole: UserRole = input?.activeRole ?? roles[0];
  const isCreator = roles.includes('creator');

  return {
    fullName: input?.fullName ?? 'LiveGate Demo User',
    email: input?.email ?? 'demo@livegate.app',
    roles,
    defaultRole,
    notificationPreferences: {
      liveReminders: true,
      purchaseUpdates: true,
      creatorAnnouncements: true,
      systemAlerts: true,
    },
    appearancePreferences: {
      theme: 'system',
      compactMode: false,
    },
    privacyPreferences: {
      publicCreatorProfile: isCreator,
      communityVisibility: true,
    },
    payoutPreferences: isCreator
      ? {
          method: 'Bank transfer',
          note: 'Weekly settlement window',
        }
      : undefined,
  };
}

export function signInWithDemo(input: {
  email: string;
  password: string;
  roles?: UserRole[];
  activeRole?: UserRole;
}) {
  const participant = findParticipant(input.email);
  const assignedRoles: UserRole[] =
    input.roles?.length ? input.roles : participant?.roles ?? ['viewer'];
  const role: UserRole = input.activeRole ?? participant?.defaultRole ?? assignedRoles[0];

  if (participant && input.password === participant.password) {
    return normalizeAuthSession(
      {
        isDemo: true,
        activeRole: role,
        user: {
          id: participant.id,
          fullName: participant.fullName,
          email: participant.email,
          role,
          roles: participant.roles,
        },
        tokens: {
          accessToken: `demo-token-${participant.id}`,
          refreshToken: `demo-refresh-${participant.id}`,
          expiresAt: '2026-12-31T23:59:59.000Z',
        },
      },
      participant.roles,
      role,
    );
  }

  if (input.password !== DEMO_PASSWORD) {
    throw new Error('Use one of the demo accounts with the shared demo password to access preview mode.');
  }

  return normalizeAuthSession(
    {
      isDemo: true,
      activeRole: role,
      user: {
        id: 'demo-custom',
        fullName: 'LiveGate Demo User',
        email: input.email,
        role,
        roles: assignedRoles,
      },
      tokens: {
        accessToken: 'demo-token-custom',
        refreshToken: 'demo-refresh-custom',
        expiresAt: '2026-12-31T23:59:59.000Z',
      },
    },
    assignedRoles,
    role,
  );
}

export function signUpWithDemo(input: {
  fullName: string;
  email: string;
  roles?: UserRole[];
  activeRole?: UserRole;
}) {
  const roles: UserRole[] = input.roles?.length ? input.roles : ['viewer'];
  const activeRole: UserRole = input.activeRole ?? roles[0];

  return normalizeAuthSession(
    {
      isDemo: true,
      activeRole,
      user: {
        id: `demo-signup-${input.email.toLowerCase()}`,
        fullName: input.fullName,
        email: input.email,
        role: activeRole,
        roles,
      },
      tokens: {
        accessToken: `demo-token-${input.email.toLowerCase()}`,
        refreshToken: `demo-refresh-${input.email.toLowerCase()}`,
        expiresAt: '2026-12-31T23:59:59.000Z',
      },
    },
    roles,
    activeRole,
  );
}

export function getDemoHomeFeed(): HomeFeedPayload {
  return {
    categories: categories.slice(0, 6),
    featuredCreators: creators,
    trendingLives: liveSessions,
    premiumContent,
    recommendedClasses: classes,
  };
}

export function getDemoCategoryDetail(slug: CategorySlug): CategoryDetailPayload {
  return {
    category: categories.find((category) => category.slug === slug) ?? categories[0],
    creators: listResponse(creators.filter((creator) => creator.categories.includes(slug))),
    lives: listResponse(liveSessions.filter((live) => live.category === slug)),
    premiumContent: listResponse(premiumContent.filter((item) => item.category === slug)),
    classes: listResponse(classes.filter((item) => item.category === slug)),
  };
}

export function getDemoCreatorProfile(id: string): CreatorProfilePayload {
  const creator = creators.find((item) => item.id === id) ?? creators[0];

  return {
    creator,
    reviews: listResponse(reviews.filter((review, index) => creators[index % creators.length].id === creator.id)),
    upcomingLives: listResponse(liveSessions.filter((live) => live.creator.id === creator.id)),
    premiumContent: listResponse(premiumContent.filter((item) => item.creator.id === creator.id)),
    classes: listResponse(classes.filter((item) => item.creator.id === creator.id)),
  };
}

export function getDemoLiveDetail(id: string): LiveSessionDetailPayload {
  const live = liveSessions.find((item) => item.id === id) ?? liveSessions[0];

  return {
    live,
    relatedLives: listResponse(liveSessions.filter((item) => item.id !== live.id)),
  };
}

export function getDemoLiveRoom(id: string): LiveRoomPayload {
  return {
    live: getDemoLiveDetail(id).live,
    chatEnabled: true,
    hostNotes: [
      'Welcome everyone. Today we will cover setup quality, risk, and review.',
      'Questions are prioritized after the first thirty minutes of the session.',
    ],
  };
}

export function getDemoPremiumContentDetail(id: string): PremiumContentDetailPayload {
  return {
    content: premiumContent.find((item) => item.id === id) ?? premiumContent[0],
  };
}

export function getDemoClassDetail(id: string): ClassDetailPayload {
  return {
    classItem: classes.find((item) => item.id === id) ?? classes[0],
  };
}

export function getDemoViewerDashboard(): ViewerDashboardPayload {
  return {
    purchasedLives: listResponse(liveSessions.filter((item) => item.accessGranted)),
    purchasedContent: listResponse(premiumContent.filter((item) => item.accessGranted)),
    enrolledClasses: listResponse(classes.filter((item) => item.accessGranted)),
    followedCreators: listResponse(creators.slice(0, 2)),
    transactions: listResponse(viewerTransactions),
  };
}

export function getDemoCreatorDashboard(): CreatorDashboardPayload {
  return {
    wallet: creatorWallet,
    followers: 12880,
    verificationStatus: 'verified',
    recentTransactions: listResponse(creatorTransactions),
    managedContent: listResponse(managedContent.filter((item) => item.creatorName === creators[0].displayName)),
  };
}

export function getDemoAdminDashboard(): AdminDashboardPayload {
  return {
    totalUsers: 18420,
    totalCreators: 1340,
    activeLiveSessions: 42,
    totalRevenue: 286400,
    platformCommission: 57280,
    pendingPayouts: 18,
    creatorApprovals: 24,
    flaggedContent: 7,
    suspiciousPayments: 3,
    managedContent: listResponse(managedContent),
  };
}

export function getDemoNotifications() {
  return listResponse(notifications);
}

export function searchDemo(filters: SearchFilters): SearchResultsPayload {
  const needle = filters.query?.trim().toLowerCase() ?? '';
  const type = filters.type ?? 'all';
  const category = filters.category;

  const filterText = <T extends { title?: string; description?: string; displayName?: string; headline?: string; category?: CategorySlug }>(
    item: T,
  ) => {
    const categoryPass = !category || item.category === category || ('categories' in item && Array.isArray(item.categories) && item.categories.includes(category));
    const text =
      `${item.title ?? ''} ${item.description ?? ''} ${item.displayName ?? ''} ${item.headline ?? ''}`.toLowerCase();
    return categoryPass && (!needle || text.includes(needle));
  };

  return {
    creators: type === 'all' || type === 'creator' ? creators.filter(filterText) : [],
    lives: type === 'all' || type === 'live' ? liveSessions.filter(filterText) : [],
    content: type === 'all' || type === 'content' ? premiumContent.filter(filterText) : [],
    classes: type === 'all' || type === 'class' ? classes.filter(filterText) : [],
  };
}

export function createDemoCheckout(input: {
  productId: string;
  productType: 'live' | 'content' | 'class';
}): CheckoutSummary {
  const item =
    input.productType === 'live'
      ? liveSessions.find((live) => live.id === input.productId)
      : input.productType === 'content'
        ? premiumContent.find((content) => content.id === input.productId)
        : classes.find((classItem) => classItem.id === input.productId);

  const amount = item?.price ?? 0;

  return {
    id: `checkout-${input.productId}`,
    title: item?.title ?? 'LiveGate purchase',
    amount,
    currency: 'USD',
    productType: input.productType,
    category: item?.category,
    creatorName: item?.creator.displayName,
    platformCommissionAmount: calculateCommission(amount),
    creatorEarningsAmount: calculateCreatorNet(amount),
    totalAmount: amount,
    sessionStatus: 'ready',
    accessPolicy:
      input.productType === 'live'
        ? 'Payment is required before joining the live room.'
        : input.productType === 'content'
          ? 'Payment is required before premium content unlocks.'
          : 'Payment is required before class enrollment becomes active.',
  };
}

export function getDemoProfileSettings(input?: {
  fullName?: string;
  email?: string;
  roles?: UserRole[];
  activeRole?: UserRole;
}) {
  return createDemoSettings(input);
}

export function saveDemoProfileSettings(
  input: ProfileSettingsPayload,
): SaveProfileSettingsResponse {
  return {
    message: 'Profile settings saved in demo mode.',
    settings: input,
  };
}

export function requestDemoPayout(body: { amount: number; method: string }) {
  return {
    message: `Demo payout request for ${body.amount} USD via ${body.method} has been queued for review.`,
  };
}

export function forgotPasswordDemo() {
  return { message: 'Demo reset link issued. Use any token with the reset form in demo mode.' };
}

export function resetPasswordDemo() {
  return { message: 'Demo password updated. Use Demo@12345 to continue exploring the flows.' };
}

