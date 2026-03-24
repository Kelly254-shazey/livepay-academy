import type { CategorySlug } from './catalog';

export type UserRole = 'viewer' | 'creator' | 'moderator' | 'admin';
export type AuthProvider = 'local' | 'google';
export type AuthNextStep = 'verify-email' | 'complete-profile' | null;
export type GenderOption = 'male' | 'female' | 'prefer_not_to_say' | 'custom';
export type DemoAudience = 'public' | 'staff';
export type VerificationStatus = 'unverified' | 'pending' | 'verified';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type TransactionType = 'purchase' | 'earning' | 'payout' | 'commission';
export type NotificationType =
  | 'live-reminder'
  | 'purchase'
  | 'announcement'
  | 'payout'
  | 'system';

export interface ApiListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiMeta {
  requestId?: string;
  message?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorShape {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  role: UserRole;
  roles?: UserRole[];
  avatarUrl?: string | null;
  emailVerified?: boolean;
  profileCompleted?: boolean;
  dateOfBirth?: string;
  gender?: GenderOption;
  customGender?: string;
  authProviders?: AuthProvider[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  refreshExpiresAt?: string;
}

export interface AuthSession {
  user: UserAccount;
  tokens: AuthTokens;
  activeRole?: UserRole;
  nextStep?: AuthNextStep;
  isDemo?: boolean;
}

export interface DemoParticipant {
  id: string;
  audience: DemoAudience;
  fullName: string;
  email: string;
  password: string;
  title: string;
  roleLabel: string;
  roles: UserRole[];
  defaultRole: UserRole;
  summary: string;
}

export interface CreatorSummary {
  id: string;
  displayName: string;
  handle: string;
  headline: string;
  bio?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  verificationStatus: VerificationStatus;
  rating?: number;
  followerCount: number;
  reviewCount: number;
  categories: CategorySlug[];
}

export interface CreatorReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface LiveSessionSummary {
  id: string;
  title: string;
  description: string;
  creator: CreatorSummary;
  category: CategorySlug;
  price: number;
  startTime: string;
  endTime?: string;
  isLive: boolean;
  viewerCount: number;
  accessGranted: boolean;
}

export interface LiveRoomPayload {
  live: LiveSessionSummary;
  hostNotes?: string[];
  chatEnabled: boolean;
}

export interface PremiumContentSummary {
  id: string;
  title: string;
  description: string;
  creator: CreatorSummary;
  category: CategorySlug;
  price: number;
  accessGranted: boolean;
  attachmentCount: number;
}

export interface ClassLesson {
  id: string;
  title: string;
  durationLabel: string;
  accessGranted: boolean;
}

export interface ClassSummary {
  id: string;
  title: string;
  description: string;
  creator: CreatorSummary;
  category: CategorySlug;
  price: number;
  scheduleLabel: string;
  materials: string[];
  lessons: ClassLesson[];
  accessGranted: boolean;
}

export interface CheckoutSummary {
  id: string;
  title: string;
  amount: number;
  currency: string;
  productType?: 'live' | 'content' | 'class';
  category?: CategorySlug;
  creatorName?: string;
  platformCommissionAmount?: number;
  creatorEarningsAmount?: number;
  totalAmount?: number;
  sessionStatus?: 'draft' | 'ready';
  accessPolicy?: string;
}

export interface ProfileSettingsPayload {
  fullName: string;
  email: string;
  roles: UserRole[];
  defaultRole: UserRole;
  notificationPreferences: {
    liveReminders: boolean;
    purchaseUpdates: boolean;
    creatorAnnouncements: boolean;
    systemAlerts: boolean;
  };
  appearancePreferences: {
    theme: 'system' | 'light' | 'dark';
    compactMode: boolean;
  };
  privacyPreferences: {
    publicCreatorProfile: boolean;
    communityVisibility: boolean;
  };
  payoutPreferences?: {
    method: string;
    note?: string;
  };
}

export interface SaveProfileSettingsResponse {
  message: string;
  settings: ProfileSettingsPayload;
}

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  counterparty?: string;
}

export interface WalletSummary {
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  currency: string;
}

export type ManagedContentKind = 'live' | 'content' | 'class';

export interface ManagedContentRecord {
  id: string;
  kind: ManagedContentKind;
  title: string;
  price: number;
  currency: string;
  status: string;
  category: CategorySlug;
  creatorName: string;
  createdAt: string;
  scheduleLabel?: string;
  deliveryLabel?: string;
}

export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  status?: 'active' | 'archived';
}

export interface ViewerDashboardPayload {
  purchasedLives: ApiListResponse<LiveSessionSummary>;
  purchasedContent: ApiListResponse<PremiumContentSummary>;
  enrolledClasses: ApiListResponse<ClassSummary>;
  followedCreators: ApiListResponse<CreatorSummary>;
  transactions: ApiListResponse<TransactionRecord>;
}

export interface CreatorDashboardPayload {
  wallet: WalletSummary;
  followers: number;
  verificationStatus: VerificationStatus;
  recentTransactions: ApiListResponse<TransactionRecord>;
  managedContent: ApiListResponse<ManagedContentRecord>;
}

export interface AdminDashboardPayload {
  totalUsers: number;
  totalCreators: number;
  activeLiveSessions: number;
  totalRevenue: number;
  platformCommission: number;
  pendingPayouts: number;
  creatorApprovals: number;
  flaggedContent: number;
  suspiciousPayments: number;
  managedContent: ApiListResponse<ManagedContentRecord>;
}

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface SearchFilters {
  query?: string;
  category?: CategorySlug;
  type?: 'creator' | 'live' | 'content' | 'class' | 'all';
}

export interface SearchResultsPayload {
  creators: CreatorSummary[];
  lives: LiveSessionSummary[];
  content: PremiumContentSummary[];
  classes: ClassSummary[];
}

export interface HomeFeedPayload {
  categories: Array<{
    slug: CategorySlug;
    title: string;
    shortDescription: string;
  }>;
  featuredCreators: CreatorSummary[];
  trendingLives: LiveSessionSummary[];
  premiumContent: PremiumContentSummary[];
  recommendedClasses: ClassSummary[];
}

export interface CategoryDetailPayload {
  category: {
    slug: CategorySlug;
    title: string;
    shortDescription: string;
  };
  creators: ApiListResponse<CreatorSummary>;
  lives: ApiListResponse<LiveSessionSummary>;
  premiumContent: ApiListResponse<PremiumContentSummary>;
  classes: ApiListResponse<ClassSummary>;
}

export interface CreatorProfilePayload {
  creator: CreatorSummary;
  reviews: ApiListResponse<CreatorReview>;
  upcomingLives: ApiListResponse<LiveSessionSummary>;
  premiumContent: ApiListResponse<PremiumContentSummary>;
  classes: ApiListResponse<ClassSummary>;
}

export interface LiveSessionDetailPayload {
  live: LiveSessionSummary;
  relatedLives: ApiListResponse<LiveSessionSummary>;
}

export interface PremiumContentDetailPayload {
  content: PremiumContentSummary;
}

export interface ClassDetailPayload {
  classItem: ClassSummary;
}
