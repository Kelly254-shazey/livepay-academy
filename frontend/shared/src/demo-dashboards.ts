/**
 * Demo Dashboard Participants & Content
 * Used for showcasing different roles and their respective dashboards
 */

export const demoDashboardParticipants = {
  creators: [
    {
      id: 'creator-1',
      displayName: 'Sarah Chen',
      email: 'sarah@example.com',
      headline: 'Wellness & Meditation Expert',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      role: 'creator',
      stats: {
        totalSubscribers: 12458,
        monthlyRevenue: 5420,
        livestreamsHosted: 89,
        totalHours: 156,
        engagementRate: 94.2,
      },
      recentSessions: [
        {
          id: 'session-1',
          title: 'Morning Yoga & Mindfulness',
          type: 'audio',
          scheduledFor: '2026-03-22T08:00:00Z',
          participants: 234,
          revenue: 245.50,
        },
      ],
    },
    {
      id: 'creator-2',
      displayName: 'Marcus Johnson',
      email: 'marcus@example.com',
      headline: 'Tech & Blockchain Expert',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
      role: 'creator',
      stats: {
        totalSubscribers: 8932,
        monthlyRevenue: 3840,
        livestreamsHosted: 62,
        totalHours: 124,
        engagementRate: 88.5,
      },
      recentSessions: [
        {
          id: 'session-2',
          title: 'Web3 Development Workshop',
          type: 'both',
          scheduledFor: '2026-03-23T14:00:00Z',
          participants: 156,
          revenue: 180.25,
        },
      ],
    },
  ],
  viewers: [
    {
      id: 'viewer-1',
      displayName: 'Emma Rodriguez',
      email: 'emma@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
      role: 'viewer',
      stats: {
        sessionsAttended: 24,
        coursesCompleted: 5,
        totalSpent: 234.50,
        hoursLearned: 45,
        bookmarkedContent: 18,
      },
      subscriptions: [
        {
          id: 'sub-1',
          creatorName: 'Sarah Chen',
          monthlyFee: 9.99,
          status: 'active',
        },
        {
          id: 'sub-2',
          creatorName: 'Marcus Johnson',
          monthlyFee: 14.99,
          status: 'active',
        },
      ],
    },
    {
      id: 'viewer-2',
      displayName: 'James Wilson',
      email: 'james@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
      role: 'viewer',
      stats: {
        sessionsAttended: 18,
        coursesCompleted: 3,
        totalSpent: 156.75,
        hoursLearned: 32,
        bookmarkedContent: 12,
      },
      subscriptions: [
        {
          id: 'sub-3',
          creatorName: 'Sarah Chen',
          monthlyFee: 9.99,
          status: 'active',
        },
      ],
    },
  ],
  admins: [
    {
      id: 'admin-1',
      displayName: 'Alex Kumar',
      email: 'admin@livepay.com',
      role: 'admin',
      lastLogin: '2026-03-21T10:30:00Z',
      stats: {
        totalUsers: 45238,
        activeCreators: 1240,
        platformRevenue: 128450.75,
        communityHealth: 94.5,
        pendingReports: 12,
      },
    },
  ],
  moderators: [
    {
      id: 'mod-1',
      displayName: 'Lisa Park',
      email: 'moderator@livepay.com',
      role: 'moderator',
      lastLogin: '2026-03-21T09:15:00Z',
      stats: {
        issuesResolved: 234,
        usersSupported: 456,
        avgResolutionTime: '2.5 hours',
        userSatisfaction: 92.3,
        pendingTickets: 8,
      },
    },
  ],
};

export const demoDashboardContent = {
  trending: [
    {
      id: 'content-1',
      title: 'Mindfulness Meditation for Beginners',
      creator: 'Sarah Chen',
      type: 'video',
      price: 9.99,
      rating: 4.8,
      purchases: 1234,
      revenue: 12345.66,
    },
    {
      id: 'content-2',
      title: 'Crypto Portfolio Management',
      creator: 'Marcus Johnson',
      type: 'course',
      price: 49.99,
      rating: 4.7,
      purchases: 456,
      revenue: 22794.44,
    },
  ],
  newLiveStreams: [
    {
      id: 'live-1',
      title: 'Live Q&A: Meditation Tips',
      creator: 'Sarah Chen',
      startsAt: '2026-03-22T08:00:00Z',
      viewers: 234,
      maxCapacity: 500,
    },
    {
      id: 'live-2',
      title: 'Web3 Development Masterclass',
      creator: 'Marcus Johnson',
      startsAt: '2026-03-23T14:00:00Z',
      viewers: 156,
      maxCapacity: 300,
    },
  ],
};
