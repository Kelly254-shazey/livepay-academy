import { categories, type CategorySlug } from './catalog';
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
  ManagedContentRecord,
  NotificationRecord,
  PremiumContentDetailPayload,
  PremiumContentSummary,
  ProfileSettingsPayload,
  SaveProfileSettingsResponse,
  SearchFilters,
  SearchResultsPayload,
  TransactionRecord,
  UserRole,
  ViewerDashboardPayload,
} from './contracts';

export const DEMO_PASSWORD = 'Demo@12345';
export const DEMO_LIVE_ACCESS_CODE = '12345';
export const DEFAULT_VIEWER_ENTRY_LIVE_ID = 'live-nairobi-city-lights';

const NOW = '2026-03-26T15:00:00.000Z';
const defaultCategory = categories[0];

const list = <T,>(items: T[]): ApiListResponse<T> => ({
  items,
  total: items.length,
  page: 1,
  pageSize: Math.max(1, items.length),
});

const creator = (
  overrides: Partial<CreatorSummary> = {},
  category: CategorySlug = defaultCategory.slug,
): CreatorSummary => ({
  id: overrides.id ?? 'creator-demo',
  displayName: overrides.displayName ?? 'Kelly Florence',
  handle: overrides.handle ?? '@kellyflo',
  headline: overrides.headline ?? 'Creator-led classes, live sessions, and premium guidance.',
  bio: overrides.bio ?? 'Demo creator profile used when the backend is unavailable.',
  avatarUrl: overrides.avatarUrl ?? null,
  bannerUrl: overrides.bannerUrl ?? null,
  verificationStatus: overrides.verificationStatus ?? 'verified',
  rating: overrides.rating ?? 4.9,
  followerCount: overrides.followerCount ?? 1840,
  reviewCount: overrides.reviewCount ?? 127,
  categories: overrides.categories ?? [category],
});

const live = (
  overrides: Partial<LiveSessionSummary> = {},
  category: CategorySlug = defaultCategory.slug,
): LiveSessionSummary => ({
  id: overrides.id ?? DEFAULT_VIEWER_ENTRY_LIVE_ID,
  title: overrides.title ?? 'Nairobi City Lights Market Breakdown',
  description: overrides.description ?? 'A demo live session covering creator insights and audience Q&A.',
  creator: overrides.creator ?? creator({}, category),
  category: overrides.category ?? category,
  price: overrides.price ?? 25,
  startTime: overrides.startTime ?? NOW,
  endTime: overrides.endTime,
  isLive: overrides.isLive ?? true,
  viewerCount: overrides.viewerCount ?? 126,
  accessGranted: overrides.accessGranted ?? true,
});

const premiumContent = (
  overrides: Partial<PremiumContentSummary> = {},
  category: CategorySlug = defaultCategory.slug,
): PremiumContentSummary => ({
  id: overrides.id ?? 'content-demo-masterclass',
  title: overrides.title ?? 'Creator Growth Systems Playbook',
  description: overrides.description ?? 'Premium demo content for offline preview mode.',
  creator: overrides.creator ?? creator({}, category),
  category: overrides.category ?? category,
  price: overrides.price ?? 45,
  accessGranted: overrides.accessGranted ?? true,
  attachmentCount: overrides.attachmentCount ?? 3,
});

const classItem = (
  overrides: Partial<ClassSummary> = {},
  category: CategorySlug = defaultCategory.slug,
): ClassSummary => ({
  id: overrides.id ?? 'class-demo-growth-sprint',
  title: overrides.title ?? '30-Day Growth Sprint',
  description: overrides.description ?? 'Structured class content for demo and offline preview flows.',
  creator: overrides.creator ?? creator({}, category),
  category: overrides.category ?? category,
  price: overrides.price ?? 65,
  scheduleLabel: overrides.scheduleLabel ?? 'Starts every Monday',
  materials: overrides.materials ?? ['Workbook', 'Replay access'],
  lessons: overrides.lessons ?? [{ id: 'lesson-demo-1', title: 'Audience Positioning', durationLabel: '18 min', accessGranted: true }],
  accessGranted: overrides.accessGranted ?? true,
});

const transaction = (overrides: Partial<TransactionRecord> = {}): TransactionRecord => ({
  id: overrides.id ?? 'txn-demo-1',
  type: overrides.type ?? 'purchase',
  title: overrides.title ?? 'Live session access',
  amount: overrides.amount ?? 25,
  currency: overrides.currency ?? 'USD',
  status: overrides.status ?? 'paid',
  createdAt: overrides.createdAt ?? NOW,
  counterparty: overrides.counterparty ?? 'Kelly Florence',
});

const managedContent = (kind: ManagedContentRecord['kind']): ManagedContentRecord => ({
  id: `${kind}-demo-1`,
  kind,
  title: kind === 'live' ? 'Live audience workshop' : kind === 'content' ? 'Premium tutorial bundle' : 'Cohort class kickoff',
  price: kind === 'content' ? 45 : 25,
  currency: 'USD',
  status: kind === 'live' ? 'published' : 'ready',
  category: defaultCategory.slug,
  creatorName: 'Kelly Florence',
  createdAt: NOW,
  scheduleLabel: kind === 'class' ? 'Weekly' : undefined,
  deliveryLabel: kind === 'content' ? 'Instant access' : undefined,
});

const buildSession = (input: {
  email: string;
  fullName?: string;
  activeRole?: UserRole;
  roles?: UserRole[];
}): AuthSession => {
  const activeRole = input.activeRole ?? input.roles?.[0] ?? 'viewer';
  const roles = Array.from(new Set([activeRole, ...(input.roles ?? [])]));
  return {
    user: {
      id: `demo-${activeRole}`,
      fullName: input.fullName ?? 'Demo User',
      email: input.email,
      role: activeRole,
      roles,
      emailVerified: true,
      profileCompleted: true,
      authProviders: ['local'],
    },
    tokens: {
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token',
      expiresAt: NOW,
      refreshExpiresAt: '2026-04-26T15:00:00.000Z',
    },
    activeRole,
    nextStep: null,
    isDemo: true,
  };
};

const primaryCreator = creator();
const secondaryCreator = creator(
  {
    id: 'creator-demo-2',
    displayName: 'Amina Wanjiru',
    handle: '@aminaw',
    headline: 'Career and mentorship sessions for ambitious professionals.',
    followerCount: 920,
    reviewCount: 61,
  },
  'career-coaching',
);
const primaryLive = live();
const secondaryLive = live({ id: 'live-demo-2', title: 'Career Strategy Office Hours', creator: secondaryCreator, viewerCount: 54 }, 'career-coaching');
const premium = premiumContent();
const cohort = classItem();
const reviews: CreatorReview[] = [{ id: 'review-demo-1', authorName: 'LiveGate Viewer', rating: 5, comment: 'Clear teaching, practical examples, and strong pacing.', createdAt: NOW }];
const notifications: NotificationRecord[] = [{ id: 'notif-demo-1', type: 'system', title: 'Demo mode active', body: 'The backend is unreachable, so LiveGate is using local preview data.', createdAt: NOW, read: false }];

export const demoParticipants: DemoParticipant[] = [
  {
    id: 'demo-viewer',
    audience: 'public',
    fullName: 'Demo Viewer',
    email: 'viewer@demo.livegate.app',
    password: DEMO_PASSWORD,
    title: 'Viewer mode',
    roleLabel: 'Viewer',
    roles: ['viewer'],
    defaultRole: 'viewer',
    summary: 'Browse creators, buy access, and preview the audience flow.',
  },
  {
    id: 'demo-creator',
    audience: 'public',
    fullName: 'Demo Creator',
    email: 'creator@demo.livegate.app',
    password: DEMO_PASSWORD,
    title: 'Creator mode',
    roleLabel: 'Creator',
    roles: ['creator'],
    defaultRole: 'creator',
    summary: 'Preview creator dashboards, payouts, and content management.',
  },
];

export const signInWithDemo = buildSession;
export const signUpWithDemo = buildSession;

export function createDemoCheckout(input: { productId: string; productType: 'live' | 'content' | 'class' }): CheckoutSummary {
  const amount = input.productType === 'live' ? primaryLive.price : input.productType === 'content' ? premium.price : cohort.price;
  const title = input.productType === 'live' ? primaryLive.title : input.productType === 'content' ? premium.title : cohort.title;
  return {
    id: `checkout-${input.productId}`,
    title,
    amount,
    currency: 'USD',
    productType: input.productType,
    category: defaultCategory.slug,
    creatorName: primaryCreator.displayName,
    platformCommissionAmount: Number((amount * 0.15).toFixed(2)),
    creatorEarningsAmount: Number((amount * 0.85).toFixed(2)),
    totalAmount: amount,
    sessionStatus: 'ready',
    accessPolicy: 'Immediate demo access',
  };
}

export function forgotPasswordDemo(input: { email: string }): { message: string; maskedEmail: string } {
  const [localPart, domain = 'demo.local'] = input.email.split('@');
  return { message: 'Recovery code sent in demo mode.', maskedEmail: `${localPart.slice(0, 1)}***@${domain}` };
}

export function resetPasswordDemo(_: { email: string; code: string; password: string }): { message: string } {
  return { message: 'Password reset completed in demo mode.' };
}

export function getDemoAdminDashboard(): AdminDashboardPayload {
  return {
    totalUsers: 12840,
    totalCreators: 412,
    activeLiveSessions: 8,
    totalRevenue: 284500,
    platformCommission: 42675,
    pendingPayouts: 7200,
    creatorApprovals: 6,
    flaggedContent: 2,
    suspiciousPayments: 1,
    managedContent: list([managedContent('live'), managedContent('content'), managedContent('class')]),
  };
}

export function getDemoCategoryDetail(slug: string): CategoryDetailPayload {
  const category = categories.find((item) => item.slug === slug) ?? defaultCategory;
  return {
    category,
    creators: list([creator({}, category.slug)]),
    lives: list([live({}, category.slug)]),
    premiumContent: list([premiumContent({}, category.slug)]),
    classes: list([classItem({}, category.slug)]),
  };
}

export const getDemoClassDetail = (id: string): ClassDetailPayload => ({ classItem: classItem({ id }) });
export const getDemoCreatorDashboard = (): CreatorDashboardPayload => ({
  wallet: { availableBalance: 1820, pendingBalance: 245, lifetimeEarnings: 14890, currency: 'USD' },
  followers: primaryCreator.followerCount,
  verificationStatus: primaryCreator.verificationStatus,
  recentTransactions: list([transaction({ id: 'txn-demo-creator-1', type: 'earning', title: 'Creator payout credit' })]),
  managedContent: list([managedContent('live'), managedContent('content'), managedContent('class')]),
});
export const getDemoCreatorProfile = (id: string): CreatorProfilePayload => ({
  creator: creator({ id }),
  reviews: list(reviews),
  upcomingLives: list([primaryLive, secondaryLive]),
  premiumContent: list([premium]),
  classes: list([cohort]),
});
export const getDemoHomeFeed = (): HomeFeedPayload => ({
  categories: categories.map((item) => ({ slug: item.slug, title: item.title, shortDescription: item.shortDescription })),
  featuredCreators: [primaryCreator, secondaryCreator],
  trendingLives: [primaryLive, secondaryLive],
  premiumContent: [premium],
  recommendedClasses: [cohort],
});
export const getDemoLiveDetail = (id: string): LiveSessionDetailPayload => ({ live: live({ id }), relatedLives: list([secondaryLive]) });
export const getDemoLiveRoom = (id: string): LiveRoomPayload => ({
  live: live({ id }),
  hostNotes: ['Welcome to the LiveGate demo room.', 'Questions are answered in the final 10 minutes.'],
  chatEnabled: true,
});
export const getDemoNotifications = (): ApiListResponse<NotificationRecord> => list(notifications);
export function getDemoProfileSettings(
  overrides: Partial<Pick<ProfileSettingsPayload, 'fullName' | 'email' | 'roles' | 'defaultRole'>> = {},
): ProfileSettingsPayload {
  const roles: UserRole[] = overrides.roles?.length ? overrides.roles : ['viewer'];
  return {
    fullName: overrides.fullName ?? 'Demo User',
    email: overrides.email ?? 'viewer@demo.livegate.app',
    roles,
    defaultRole: overrides.defaultRole ?? roles[0] ?? 'viewer',
    notificationPreferences: { liveReminders: true, purchaseUpdates: true, creatorAnnouncements: true, systemAlerts: true },
    appearancePreferences: { theme: 'system', compactMode: false },
    privacyPreferences: { publicCreatorProfile: true, communityVisibility: true },
    payoutPreferences: { method: 'Bank transfer', note: 'Demo payout account' },
  };
}
export const getDemoPremiumContentDetail = (id: string): PremiumContentDetailPayload => ({ content: premiumContent({ id }) });
export const getDemoViewerDashboard = (): ViewerDashboardPayload => ({
  purchasedLives: list([primaryLive]),
  purchasedContent: list([premium]),
  enrolledClasses: list([cohort]),
  followedCreators: list([primaryCreator, secondaryCreator]),
  transactions: list([transaction(), transaction({ id: 'txn-demo-2', title: 'Premium content purchase', amount: premium.price })]),
});
export const requestDemoPayout = (input: { amount: number; method: string; note?: string }): { message: string } => ({
  message: `Demo payout request received for ${input.amount} via ${input.method}.`,
});
export const saveDemoProfileSettings = (data: ProfileSettingsPayload): SaveProfileSettingsResponse => ({
  message: 'Profile settings saved in demo mode.',
  settings: data,
});
export function searchDemo(filters: SearchFilters): SearchResultsPayload {
  const query = filters.query?.trim().toLowerCase();
  const matchesQuery = (value: string) => !query || value.toLowerCase().includes(query);
  const matchesCategory = (category: CategorySlug) => !filters.category || filters.category === category;
  const type = filters.type ?? 'all';
  const creators = [primaryCreator, secondaryCreator].filter((item) => matchesQuery(`${item.displayName} ${item.headline} ${item.handle}`) && item.categories.some(matchesCategory));
  const lives = [primaryLive, secondaryLive].filter((item) => matchesQuery(`${item.title} ${item.description}`) && matchesCategory(item.category));
  const content = [premium].filter((item) => matchesQuery(`${item.title} ${item.description}`) && matchesCategory(item.category));
  const classes = [cohort].filter((item) => matchesQuery(`${item.title} ${item.description}`) && matchesCategory(item.category));
  return {
    creators: type === 'all' || type === 'creator' ? creators : [],
    lives: type === 'all' || type === 'live' ? lives : [],
    content: type === 'all' || type === 'content' ? content : [],
    classes: type === 'all' || type === 'class' ? classes : [],
  };
}
