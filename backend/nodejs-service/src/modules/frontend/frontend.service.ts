import type { NotificationType, PrismaClient, UserRole } from "@prisma/client";

import { deriveUserRoles } from "../../common/auth/roles";
import { env } from "../../config/env";
import { AppError } from "../../common/errors/app-error";
import { AccessService } from "../access/access.service";
import { AuthService } from "../auth/auth.service";
import { LiveSessionsService } from "../live-sessions/live-sessions.service";
import { JavaFinanceClient } from "../../infrastructure/integrations/java-finance.client";
import { WalletsService } from "../wallets/wallets.service";

const CANONICAL_CATEGORIES = [
  ["education", "Education", "Structured learning, tutoring, and subject mastery."],
  ["trading-education", "Trading Education", "High-signal market teaching, analysis, and guided sessions."],
  ["business-entrepreneurship", "Business & Entrepreneurship", "Operators, founders, and mentors building revenue skills."],
  ["career-coaching", "Career Coaching", "Interview prep, positioning, growth, and leadership support."],
  ["mentorship", "Mentorship", "Paid access to personal guidance and long-term expertise."],
  ["fitness-wellness", "Fitness & Wellness", "Live classes, routines, and premium wellbeing programs."],
  ["creative-skills", "Creative Skills", "Design, music, editing, storytelling, and maker craft."],
  ["events-workshops", "Events & Workshops", "Time-bound intensives, launches, cohorts, and expert sessions."],
  ["premium-tutorials", "Premium Tutorials", "High-value locked lessons, replays, and downloadable resources."],
  ["entertainment-live", "Entertainment Live", "Paid live moments, performances, commentary, and audience access."]
] as const;

const CATEGORY_BY_SLUG = new Map<string, { slug: string; title: string; shortDescription: string }>(
  CANONICAL_CATEGORIES.map(([slug, title, shortDescription]) => [slug, { slug, title, shortDescription }])
);
const CATEGORY_TITLE_TO_SLUG = new Map<string, string>(
  CANONICAL_CATEGORIES.map(([slug, title]) => [title.toLowerCase(), slug])
);
const SUPPORTED_PAYMENT_METHODS = ["Card", "Apple Pay", "Google Pay", "PayPal", "M-Pesa", "Bank transfer"] as const;
const SUPPORTED_PAYOUT_METHODS = ["Bank transfer", "Mobile money", "PayPal", "Wise"] as const;

type Actor = {
  userId: string;
  role: UserRole;
  roles?: UserRole[];
  email: string;
};

type CreatorReviewStats = {
  rating?: number;
  reviewCount: number;
};

type LiveRecord = any;
type ContentRecord = any;
type ClassRecord = any;
type CreatorRecord = any;

function listResponse<T>(items: T[]) {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: items.length
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  if (value && typeof value === "object" && "toString" in value && typeof value.toString === "function") {
    return Number(value.toString());
  }

  return 0;
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const [firstName, ...rest] = trimmed.split(" ");

  return {
    firstName: firstName || "LiveGate",
    lastName: rest.join(" ") || "User"
  };
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeCategorySlug(value: string | null | undefined) {
  if (!value) {
    return "education";
  }

  const normalized = value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (CATEGORY_BY_SLUG.has(normalized)) {
    return normalized;
  }

  return CATEGORY_TITLE_TO_SLUG.get(value.toLowerCase()) ?? "education";
}

function normalizeCategoryList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => normalizeCategorySlug(item))
    )
  );
}

function toVerificationStatus(status: string) {
  if (status === "approved") {
    return "verified";
  }

  if (status === "pending") {
    return "pending";
  }

  return "unverified";
}

function toNotificationType(type: NotificationType) {
  switch (type) {
    case "live_reminder":
      return "live-reminder";
    case "creator_announcement":
      return "announcement";
    case "purchase":
      return "purchase";
    default:
      return "system";
  }
}

function formatDateLabel(value?: Date | null) {
  if (!value) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(value);
}

function formatScheduleLabel(startsAt?: Date | null, endsAt?: Date | null) {
  const starts = formatDateLabel(startsAt);
  const ends = formatDateLabel(endsAt);

  if (starts && ends) {
    return `${starts} - ${ends}`;
  }

  if (starts) {
    return `Starts ${starts}`;
  }

  if (ends) {
    return `Ends ${ends}`;
  }

  return "Schedule to be announced";
}

function getAllowedSettingsRoles(role: UserRole, hasCreatorProfile: boolean) {
  return deriveUserRoles({
    role,
    hasCreatorProfile
  });
}

export class FrontendService {
  constructor(
    private readonly db: PrismaClient,
    private readonly authService: AuthService,
    private readonly accessService: AccessService,
    private readonly javaFinanceClient: JavaFinanceClient,
    private readonly walletsService: WalletsService,
    private readonly liveSessionsService: LiveSessionsService
  ) {}

  async getSession(actor: Actor) {
    const user = await this.db.user.findUnique({
      where: { id: actor.userId },
      include: { creatorProfile: true, identities: true }
    });

    if (!user) {
      throw new AppError("Account is unavailable.", 403);
    }

    return {
      user: this.toUserAccount(user),
      tokens: {},
      nextStep: !user.emailVerifiedAt ? "verify-email" : !user.profileCompletedAt ? "complete-profile" : null
    };
  }

  async signIn(input: { identifier: string; password: string; ipAddress?: string; userAgent?: string }) {
    return this.authService.login(input);
  }

  async signUp(input: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    role: "viewer" | "creator";
    dateOfBirth: string;
    gender: string;
    customGender?: string;
    country?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.authService.register(input);
  }

  async signInWithGoogle(input: {
    idToken?: string;
    clerkToken?: string;
    role: "viewer" | "creator";
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.authService.signInWithGoogle(input);
  }

  async refreshSession(refreshToken: string, input?: { ipAddress?: string; userAgent?: string }) {
    return this.authService.refresh(refreshToken, input);
  }

  async logout(refreshToken: string, actor: Actor & { ipAddress?: string }) {
    await this.authService.logout(refreshToken, {
      userId: actor.userId,
      role: actor.role,
      ipAddress: actor.ipAddress
    });

    return { message: "Signed out successfully." };
  }

  async resendEmailVerification(actor: Actor, context?: { ipAddress?: string }) {
    const result = await this.authService.requestEmailVerification(actor.userId, context);
    return {
      message: result.message,
      verification: "verification" in result ? result.verification : undefined
    };
  }

  async verifyEmail(input: { email: string; code: string }, context?: { ipAddress?: string }) {
    return this.authService.confirmEmailVerification(input, context);
  }

  async forgotPassword(email: string, context?: { ipAddress?: string }) {
    return this.authService.requestPasswordReset(email, context);
  }

  async resetPassword(input: { email: string; code: string; password: string }, context?: { ipAddress?: string }) {
    return this.authService.confirmPasswordReset(input, context);
  }

  async completeProfile(actor: Actor, input: {
    fullName: string;
    username: string;
    dateOfBirth: string;
    gender: string;
    customGender?: string;
  }) {
    return this.authService.completeProfile(actor.userId, input);
  }

  async linkGoogleAccount(actor: Actor, input: { idToken?: string; clerkToken?: string }) {
    return this.authService.linkGoogleAccount(actor.userId, input);
  }

  async linkPasswordAccount(actor: Actor, password: string) {
    return this.authService.linkPassword(actor.userId, password);
  }

  async getProfileSettings(actor: Actor) {
    const user = await this.db.user.findUnique({
      where: { id: actor.userId },
      include: { creatorProfile: true }
    });

    if (!user) {
      throw new AppError("Account is unavailable.", 403);
    }

    const allowedRoles = getAllowedSettingsRoles(user.role, Boolean(user.creatorProfile));
    const settings = isRecord(user.settings) ? user.settings : {};
    const appearance = isRecord(settings.appearancePreferences) ? settings.appearancePreferences : {};
    const privacy = isRecord(settings.privacyPreferences) ? settings.privacyPreferences : {};
    const payout = isRecord(settings.payoutPreferences) ? settings.payoutPreferences : {};
    const notifications = isRecord(user.notificationPreferences) ? user.notificationPreferences : {};

    return {
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      roles: allowedRoles,
      defaultRole:
        allowedRoles.includes(settings.defaultRole as UserRole)
          ? settings.defaultRole as UserRole
          : allowedRoles[0],
      notificationPreferences: {
        liveReminders: readBoolean(notifications.liveReminders, true),
        purchaseUpdates: readBoolean(notifications.purchaseUpdates, true),
        creatorAnnouncements: readBoolean(notifications.creatorAnnouncements, true),
        systemAlerts: true
      },
      appearancePreferences: {
        theme:
          appearance.theme === "light" || appearance.theme === "dark" || appearance.theme === "system"
            ? appearance.theme
            : "system",
        compactMode: readBoolean(appearance.compactMode, false)
      },
      privacyPreferences: {
        publicCreatorProfile: readBoolean(privacy.publicCreatorProfile, Boolean(user.creatorProfile)),
        communityVisibility: readBoolean(privacy.communityVisibility, true)
      },
      payoutPreferences:
        user.role === "creator" || user.role === "admin"
          ? {
              method: readString(payout.method, "Bank transfer"),
              note: readString(payout.note).trim() || undefined
            }
          : undefined
    };
  }

  async getCategoryCatalog() {
    const categories = await this.db.category.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" }
    });

    return categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      status: category.status
    }));
  }

  async saveProfileSettings(
    actor: Actor,
    input: {
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
        theme: "system" | "light" | "dark";
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
  ) {
    const user = await this.db.user.findUnique({
      where: { id: actor.userId },
      include: { creatorProfile: true }
    });

    if (!user) {
      throw new AppError("Account is unavailable.", 403);
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      throw new AppError("Email changes require a dedicated verification flow.", 400);
    }

    const allowedRoles = getAllowedSettingsRoles(user.role, Boolean(user.creatorProfile));
    if (
      input.roles.length !== allowedRoles.length ||
      input.roles.some((role) => !allowedRoles.includes(role))
    ) {
      throw new AppError("Account roles cannot be changed from profile settings.", 403);
    }

    if (!allowedRoles.includes(input.defaultRole)) {
      throw new AppError("Default role is invalid for this account.", 400);
    }

    const names = splitFullName(input.fullName);
    const payoutPreferences =
      user.role === "creator" || user.role === "admin"
        ? {
            method: input.payoutPreferences?.method?.trim() || "Bank transfer",
            note: input.payoutPreferences?.note?.trim() || undefined
          }
        : undefined;

    await this.db.user.update({
      where: { id: user.id },
      data: {
        firstName: names.firstName,
        lastName: names.lastName,
        settings: {
          defaultRole: input.defaultRole,
          appearancePreferences: {
            theme: input.appearancePreferences.theme,
            compactMode: input.appearancePreferences.compactMode
          },
          privacyPreferences: {
            publicCreatorProfile: input.privacyPreferences.publicCreatorProfile,
            communityVisibility: input.privacyPreferences.communityVisibility
          },
          payoutPreferences
        },
        notificationPreferences: {
          liveReminders: input.notificationPreferences.liveReminders,
          purchaseUpdates: input.notificationPreferences.purchaseUpdates,
          creatorAnnouncements: input.notificationPreferences.creatorAnnouncements,
          systemAlerts: true
        }
      }
    });

    return {
      message: "Profile settings saved successfully.",
      settings: await this.getProfileSettings(actor)
    };
  }

  async getHomeFeed() {
    const [creators, lives, content, classes] = await Promise.all([
      this.db.user.findMany({
        where: {
          creatorProfile: {
            is: {}
          }
        },
        include: { creatorProfile: true },
        orderBy: [{ createdAt: "desc" }],
        take: 6
      }),
      this.db.liveSession.findMany({
        where: {
          status: { in: ["live", "published", "scheduled"] }
        },
        include: {
          creator: {
            include: { creatorProfile: true }
          },
          category: true
        },
        orderBy: [{ startedAt: "desc" }, { scheduledFor: "asc" }, { createdAt: "desc" }],
        take: 6
      }),
      this.db.premiumContent.findMany({
        where: {
          status: "published"
        },
        include: {
          creator: {
            include: { creatorProfile: true }
          },
          category: true
        },
        orderBy: { publishedAt: "desc" },
        take: 6
      }),
      this.db.learningClass.findMany({
        where: {
          status: "published"
        },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" }
          },
          creator: {
            include: { creatorProfile: true }
          },
          category: true
        },
        orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
        take: 6
      })
    ]);

    const creatorStats = await this.loadCreatorReviewStats(creators.map((item) => item.id));

    return {
      categories: CANONICAL_CATEGORIES.map(([slug, title, shortDescription]) => ({
        slug,
        title,
        shortDescription
      })),
      featuredCreators: creators
        .filter((item) => Boolean(item.creatorProfile))
        .map((item) => this.toCreatorSummary(item, creatorStats.get(item.id))),
      trendingLives: await this.toLiveSummaries(lives),
      premiumContent: await Promise.all(content.map((item) => this.toPremiumContentSummary(item))),
      recommendedClasses: await Promise.all(classes.map((item) => this.toClassSummary(item)))
    };
  }

  async getCategoryDetail(slug: string) {
    const canonical = CATEGORY_BY_SLUG.get(slug);
    const category = await this.db.category.findUnique({
      where: { slug }
    });

    if (!canonical && !category) {
      throw new AppError("Category unavailable.", 404);
    }

    const [creators, lives, content, classes] = await Promise.all([
      this.db.user.findMany({
        where: {
          creatorProfile: {
            is: {}
          }
        },
        include: { creatorProfile: true },
        orderBy: { createdAt: "desc" }
      }),
      category
        ? this.db.liveSession.findMany({
            where: {
              categoryId: category.id,
              status: { in: ["live", "published", "scheduled"] }
            },
            include: {
              creator: {
                include: { creatorProfile: true }
              },
              category: true
            },
            orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }]
          })
        : Promise.resolve([]),
      category
        ? this.db.premiumContent.findMany({
            where: {
              categoryId: category.id,
              status: "published"
            },
            include: {
              creator: {
                include: { creatorProfile: true }
              },
              category: true
            },
            orderBy: { publishedAt: "desc" }
          })
        : Promise.resolve([]),
      category
        ? this.db.learningClass.findMany({
            where: {
              categoryId: category.id,
              status: "published"
            },
            include: {
              lessons: {
                orderBy: { orderIndex: "asc" }
              },
              creator: {
                include: { creatorProfile: true }
              },
              category: true
            },
            orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }]
          })
        : Promise.resolve([])
    ]);

    const filteredCreators = creators.filter((item) => {
      const profile = item.creatorProfile;
      return profile ? normalizeCategoryList(profile.focusCategories).includes(slug) : false;
    });
    const creatorStats = await this.loadCreatorReviewStats(filteredCreators.map((item) => item.id));

    return {
      category: canonical ?? {
        slug: category!.slug,
        title: category!.name,
        shortDescription: category!.description ?? "Category"
      },
      creators: listResponse(filteredCreators.map((item) => this.toCreatorSummary(item, creatorStats.get(item.id)))),
      lives: listResponse(await this.toLiveSummaries(lives)),
      premiumContent: listResponse(await Promise.all(content.map((item) => this.toPremiumContentSummary(item)))),
      classes: listResponse(await Promise.all(classes.map((item) => this.toClassSummary(item))))
    };
  }

  async getCreatorProfile(creatorId: string) {
    const user = await this.db.user.findUnique({
      where: { id: creatorId },
      include: { creatorProfile: true }
    });

    if (!user?.creatorProfile) {
      throw new AppError("Creator unavailable.", 404);
    }

    const [reviews, lives, content, classes, creatorStats] = await Promise.all([
      this.db.review.findMany({
        where: {
          targetType: "creator",
          targetId: creatorId
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 20
      }),
      this.db.liveSession.findMany({
        where: {
          creatorId,
          status: { in: ["live", "published", "scheduled"] }
        },
        include: {
          creator: {
            include: { creatorProfile: true }
          },
          category: true
        },
        orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
        take: 12
      }),
      this.db.premiumContent.findMany({
        where: {
          creatorId,
          status: "published"
        },
        include: {
          creator: {
            include: { creatorProfile: true }
          },
          category: true
        },
        orderBy: { publishedAt: "desc" },
        take: 12
      }),
      this.db.learningClass.findMany({
        where: {
          creatorId,
          status: "published"
        },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" }
          },
          creator: {
            include: { creatorProfile: true }
          },
          category: true
        },
        orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
        take: 12
      }),
      this.loadCreatorReviewStats([creatorId])
    ]);

    return {
      creator: this.toCreatorSummary(user, creatorStats.get(creatorId)),
      reviews: listResponse(
        reviews.map((item) => ({
          id: item.id,
          authorName: `${item.author.firstName} ${item.author.lastName}`.trim(),
          rating: item.rating,
          comment: item.comment ?? "",
          createdAt: item.createdAt.toISOString()
        }))
      ),
      upcomingLives: listResponse(await this.toLiveSummaries(lives)),
      premiumContent: listResponse(await Promise.all(content.map((item) => this.toPremiumContentSummary(item)))),
      classes: listResponse(await Promise.all(classes.map((item) => this.toClassSummary(item))))
    };
  }

  async getLiveDetail(liveId: string, actor?: Actor) {
    const live = await this.db.liveSession.findUnique({
      where: { id: liveId },
      include: {
        creator: {
          include: { creatorProfile: true }
        },
        category: true
      }
    });

    if (!live || ["draft", "cancelled", "suspended"].includes(live.status)) {
      throw new AppError("Live unavailable.", 404);
    }

    const related = await this.db.liveSession.findMany({
      where: {
        id: { not: liveId },
        status: { in: ["live", "published", "scheduled"] },
        OR: [
          { creatorId: live.creatorId },
          ...(live.categoryId ? [{ categoryId: live.categoryId }] : [])
        ]
      },
      include: {
        creator: {
          include: { creatorProfile: true }
        },
        category: true
      },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
      take: 6
    });

    return {
      live: (await this.toLiveSummaries([live], actor))[0],
      relatedLives: listResponse(await this.toLiveSummaries(related, actor))
    };
  }

  async createLiveSession(
    actor: Actor,
    input: {
      categoryId: string;
      title: string;
      description?: string;
      price?: number;
      currency?: string;
      isPaid?: boolean;
      visibility?: "public" | "followers_only" | "private";
      scheduledFor?: string;
      roomMetadata?: Record<string, unknown>;
    }
  ) {
    return this.liveSessionsService.create(actor.userId, actor.role as "creator" | "admin", {
      ...input
    });
  }

  async publishLiveSession(actor: Actor, liveId: string) {
    return this.liveSessionsService.publish(liveId, actor.userId, actor.role as "creator" | "admin");
  }

  async getLiveRoom(actor: Actor, liveId: string) {
    const joinAccess = await this.accessService.assertLiveJoinAccess(actor.userId, actor.role, liveId);

    const live = await this.db.liveSession.findUnique({
      where: { id: liveId },
      include: {
        creator: {
          include: { creatorProfile: true }
        },
        category: true
      }
    });

    if (!live) {
      throw new AppError("Live unavailable.", 404);
    }

    const liveSummary = (await this.toLiveSummaries([live], actor))[0];
    const roomMetadata = live.roomMetadata as Record<string, unknown> | null;

    return {
      live: {
        ...liveSummary,
        accessGranted: true
      },
      roomAccessToken: joinAccess.roomAccessToken,
      roomId: live.roomId,
      hostNotes: Array.isArray(roomMetadata?.hostNotes)
        ? roomMetadata!.hostNotes.filter((item): item is string => typeof item === "string")
        : undefined,
      chatEnabled: live.status === "live"
    };
  }

  async getPremiumContentDetail(contentId: string, actor?: Actor) {
    const content = await this.db.premiumContent.findUnique({
      where: { id: contentId },
      include: {
        creator: {
          include: { creatorProfile: true }
        },
        category: true
      }
    });

    if (!content || ["draft", "archived", "suspended"].includes(content.status)) {
      throw new AppError("Premium content unavailable.", 404);
    }

    return {
      content: await this.toPremiumContentSummary(content, actor?.userId)
    };
  }

  async getClassDetail(classId: string, actor?: Actor) {
    const learningClass = await this.db.learningClass.findUnique({
      where: { id: classId },
      include: {
        lessons: {
          orderBy: { orderIndex: "asc" }
        },
        creator: {
          include: { creatorProfile: true }
        },
        category: true
      }
    });

    if (!learningClass || ["draft", "archived", "suspended"].includes(learningClass.status)) {
      throw new AppError("Class unavailable.", 404);
    }

    return {
      classItem: await this.toClassSummary(learningClass, actor?.userId)
    };
  }

  async getViewerDashboard(actor: Actor) {
    const [grants, enrollments, follows] = await Promise.all([
      this.db.accessGrant.findMany({
        where: {
          userId: actor.userId,
          status: "active"
        },
        orderBy: { createdAt: "desc" }
      }),
      this.db.enrollment.findMany({
        where: {
          userId: actor.userId,
          status: "active"
        },
        include: {
          learningClass: {
            include: {
              lessons: {
                orderBy: { orderIndex: "asc" }
              },
              creator: {
                include: { creatorProfile: true }
              },
              category: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      this.db.follow.findMany({
        where: {
          followerId: actor.userId
        },
        include: {
          creator: {
            include: { creatorProfile: true }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const liveIds = grants.filter((item) => item.targetType === "live_session").map((item) => item.targetId);
    const contentIds = grants.filter((item) => item.targetType === "premium_content").map((item) => item.targetId);
    const classIds = Array.from(
      new Set([
        ...grants.filter((item) => item.targetType === "class").map((item) => item.targetId),
        ...enrollments.map((item) => item.classId)
      ])
    );

    const [lives, content, classes, creatorStats] = await Promise.all([
      liveIds.length
        ? this.db.liveSession.findMany({
            where: { id: { in: liveIds } },
            include: {
              creator: {
                include: { creatorProfile: true }
              },
              category: true
            }
          })
        : Promise.resolve([]),
      contentIds.length
        ? this.db.premiumContent.findMany({
            where: { id: { in: contentIds } },
            include: {
              creator: {
                include: { creatorProfile: true }
              },
              category: true
            }
          })
        : Promise.resolve([]),
      classIds.length
        ? this.db.learningClass.findMany({
            where: { id: { in: classIds } },
            include: {
              lessons: {
                orderBy: { orderIndex: "asc" }
              },
              creator: {
                include: { creatorProfile: true }
              },
              category: true
            }
          })
        : Promise.resolve([]),
      this.loadCreatorReviewStats(follows.map((item) => item.creatorId))
    ]);

    const liveById = new Map(lives.map((item) => [item.id, item]));
    const contentById = new Map(content.map((item) => [item.id, item]));
    const classById = new Map(classes.map((item) => [item.id, item]));

    return {
      purchasedLives: listResponse(
        await this.toLiveSummaries(
          grants
            .filter((item) => item.targetType === "live_session")
            .map((item) => liveById.get(item.targetId))
            .filter((item): item is NonNullable<typeof item> => Boolean(item)),
          actor
        )
      ),
      purchasedContent: listResponse(
        await Promise.all(
          grants
            .filter((item) => item.targetType === "premium_content")
            .map((item) => contentById.get(item.targetId))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .map((item) => this.toPremiumContentSummary(item, actor.userId))
        )
      ),
      enrolledClasses: listResponse(
        await Promise.all(
          enrollments
            .map((item) => classById.get(item.classId) ?? item.learningClass)
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .map((item) => this.toClassSummary(item, actor.userId))
        )
      ),
      followedCreators: listResponse(
        follows
          .filter((item) => Boolean(item.creator.creatorProfile))
          .map((item) => this.toCreatorSummary(item.creator, creatorStats.get(item.creator.id)))
      ),
      transactions: listResponse([])
    };
  }

  async getCreatorDashboard(actor: Actor) {
    const user = await this.db.user.findUnique({
      where: { id: actor.userId },
      include: { creatorProfile: true }
    });

    if (!user?.creatorProfile) {
      throw new AppError("Creator profile not found.", 404);
    }

    const [wallet, ledger, managedContent] = await Promise.all([
      this.javaFinanceClient.getWalletSummary(actor.userId).catch(() => ({
        currency: env.DEFAULT_CURRENCY,
        pendingBalance: 0,
        availableBalance: 0,
        lifetimeCreatorEarnings: 0
      })),
      this.javaFinanceClient.getWalletLedger(actor.userId).catch(() => []),
      this.getManagedContent({ creatorId: actor.userId })
    ]);

    return {
      wallet: {
        availableBalance: toNumber(wallet.availableBalance),
        pendingBalance: toNumber(wallet.pendingBalance),
        lifetimeEarnings: toNumber(wallet.lifetimeCreatorEarnings),
        currency: wallet.currency ?? env.DEFAULT_CURRENCY
      },
      supportedPayoutMethods: [...SUPPORTED_PAYOUT_METHODS],
      followers: user.creatorProfile.followersCount,
      verificationStatus: toVerificationStatus(user.creatorProfile.verificationStatus),
      recentTransactions: listResponse(
        (Array.isArray(ledger) ? ledger : []).slice(0, 20).map((entry: Record<string, unknown>) => ({
          id: String(entry.id ?? `${actor.userId}-${entry.createdAt ?? Date.now()}`),
          type: this.toLedgerTransactionType(String(entry.entryType ?? "")),
          title: String(entry.description ?? "Creator wallet activity"),
          amount: Math.abs(toNumber(entry.amount)),
          currency: env.DEFAULT_CURRENCY,
          status: "paid",
          createdAt: String(entry.createdAt ?? new Date().toISOString())
        }))
      ),
      managedContent
    };
  }

  async getAdminDashboard(actor: Actor) {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = from.toISOString().slice(0, 10);
    const toDate = to.toISOString().slice(0, 10);
    const financeVisible = actor.role === "admin";

    const [totalUsers, totalCreators, activeLiveSessions, revenue, commission, creatorApprovals, flaggedContent, suspiciousPayments, managedContent] = await Promise.all([
      this.db.user.count(),
      this.db.creatorProfile.count(),
      this.db.liveSession.count({
        where: { status: "live" }
      }),
      financeVisible
        ? this.javaFinanceClient.getRevenueSummary(fromDate, toDate).catch(() => ({ grossRevenue: 0 }))
        : Promise.resolve({ grossRevenue: 0 }),
      financeVisible
        ? this.javaFinanceClient.getPlatformCommission(fromDate, toDate).catch(() => ({ platformCommission: 0 }))
        : Promise.resolve({ platformCommission: 0 }),
      this.db.creatorProfile.count({
        where: { verificationStatus: "pending" }
      }),
      this.db.report.count({
        where: {
          status: { in: ["open", "under_review"] },
          targetType: { in: ["live_session", "premium_content", "class", "message"] }
        }
      }),
      this.db.accessGrant.count({
        where: {
          riskScore: { gte: 70 }
        }
      }),
      this.getManagedContent()
    ]);

    return {
      financeVisible,
      totalUsers,
      totalCreators,
      activeLiveSessions,
      totalRevenue: toNumber(revenue.grossRevenue),
      platformCommission: toNumber(commission.platformCommission),
      pendingPayouts: 0,
      creatorApprovals,
      flaggedContent,
      suspiciousPayments,
      managedContent
    };
  }

  async getNotifications(actor: Actor) {
    const notifications = await this.db.notification.findMany({
      where: {
        userId: actor.userId
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return listResponse(
      notifications.map((item) => ({
        id: item.id,
        type: toNotificationType(item.type),
        title: item.title,
        body: item.body,
        createdAt: item.createdAt.toISOString(),
        read: Boolean(item.readAt),
        actionTargetType: isRecord(item.data) ? readString(item.data.targetType) || undefined : undefined,
        actionTargetId: isRecord(item.data) ? readString(item.data.targetId) || undefined : undefined
      }))
    );
  }

  async markNotificationRead(actor: Actor, notificationId: string) {
    const updated = await this.db.notification.updateMany({
      where: {
        id: notificationId,
        userId: actor.userId
      },
      data: {
        readAt: new Date()
      }
    });

    if (!updated.count) {
      throw new AppError("Notification not found.", 404);
    }

    return { updated: true };
  }

  async getTransactions(actor: Actor) {
    if (actor.role === "creator" || actor.role === "admin" || actor.role === "moderator") {
      const ledger = await this.javaFinanceClient.getWalletLedger(actor.userId).catch(() => []);
      return listResponse(
        (Array.isArray(ledger) ? ledger : []).map((entry: Record<string, unknown>) => ({
          id: String(entry.id ?? `${actor.userId}-${entry.createdAt ?? Date.now()}`),
          type: this.toLedgerTransactionType(String(entry.entryType ?? "")),
          title: String(entry.description ?? "Wallet activity"),
          amount: Math.abs(toNumber(entry.amount)),
          currency: env.DEFAULT_CURRENCY,
          status: "paid",
          createdAt: String(entry.createdAt ?? new Date().toISOString())
        }))
      );
    }

    return this.getViewerTransactions(actor.userId);
  }

  async search(input: { query?: string; category?: string; type: "creator" | "live" | "content" | "class" | "all" }) {
    const categorySlug = input.category ? normalizeCategorySlug(input.category) : undefined;
    const category = categorySlug
      ? await this.db.category.findUnique({
          where: { slug: categorySlug }
        })
      : null;
    const searchTerm = input.query?.trim();

    const [creators, lives, content, classes] = await Promise.all([
      input.type === "creator" || input.type === "all"
        ? this.db.user.findMany({
            where: {
              creatorProfile: { is: {} },
              ...(searchTerm
                ? {
                    OR: [
                      { firstName: { contains: searchTerm } },
                      { lastName: { contains: searchTerm } },
                      { creatorProfile: { is: { displayName: { contains: searchTerm } } } },
                      { creatorProfile: { is: { handle: { contains: searchTerm } } } },
                      { creatorProfile: { is: { headline: { contains: searchTerm } } } }
                    ]
                  }
                : {})
            },
            include: { creatorProfile: true },
            orderBy: { createdAt: "desc" },
            take: 20
          })
        : Promise.resolve([]),
      input.type === "live" || input.type === "all"
        ? this.db.liveSession.findMany({
            where: {
              status: { in: ["live", "published", "scheduled"] },
              categoryId: category?.id,
              ...(searchTerm
                ? {
                    OR: [
                      { title: { contains: searchTerm } },
                      { description: { contains: searchTerm } }
                    ]
                  }
                : {})
            },
            include: {
              creator: {
                include: { creatorProfile: true }
              },
              category: true
            },
            orderBy: [{ startedAt: "desc" }, { scheduledFor: "asc" }],
            take: 20
          })
        : Promise.resolve([]),
      input.type === "content" || input.type === "all"
        ? this.db.premiumContent.findMany({
            where: {
              status: "published",
              categoryId: category?.id,
              ...(searchTerm
                ? {
                    OR: [
                      { title: { contains: searchTerm } },
                      { description: { contains: searchTerm } },
                      { excerpt: { contains: searchTerm } }
                    ]
                  }
                : {})
            },
            include: {
              creator: {
                include: { creatorProfile: true }
              },
              category: true
            },
            orderBy: { publishedAt: "desc" },
            take: 20
          })
        : Promise.resolve([]),
      input.type === "class" || input.type === "all"
        ? this.db.learningClass.findMany({
            where: {
              status: "published",
              categoryId: category?.id,
              ...(searchTerm
                ? {
                    OR: [
                      { title: { contains: searchTerm } },
                      { description: { contains: searchTerm } }
                    ]
                  }
                : {})
            },
            include: {
              lessons: {
                orderBy: { orderIndex: "asc" }
              },
              creator: {
                include: { creatorProfile: true }
              },
              category: true
            },
            orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
            take: 20
          })
        : Promise.resolve([])
    ]);

    const creatorStats = await this.loadCreatorReviewStats(creators.map((item) => item.id));

    return {
      creators: creators
        .filter((item) => Boolean(item.creatorProfile))
        .map((item) => this.toCreatorSummary(item, creatorStats.get(item.id))),
      lives: await this.toLiveSummaries(lives),
      content: await Promise.all(content.map((item) => this.toPremiumContentSummary(item))),
      classes: await Promise.all(classes.map((item) => this.toClassSummary(item)))
    };
  }

  async createCheckout(actor: Actor, input: { productId: string; productType: "live" | "content" | "class" }) {
    const paymentAccessPolicy =
      "Checkout totals are prepared by the backend, but payment confirmation is disabled until a verified provider callback flow is integrated.";
    const commissionBreakdown = async (amount: number) => {
      const finance = await this.javaFinanceClient.calculateCommission({ amount: amount.toFixed(2) });
      return {
        totalAmount: toNumber(finance.grossAmount),
        platformCommissionAmount: toNumber(finance.platformCommissionAmount),
        creatorEarningsAmount: toNumber(finance.creatorShareAmount)
      };
    };

    switch (input.productType) {
      case "live": {
        const live = await this.db.liveSession.findUnique({
          where: { id: input.productId },
          include: {
            creator: {
              include: { creatorProfile: true }
            },
            category: true
          }
        });
        if (!live) {
          throw new AppError("Live session unavailable.", 404);
        }
        const amount = toNumber(live.price);
        const breakdown = await commissionBreakdown(amount);
        return {
          id: live.id,
          title: live.title,
          amount,
          currency: live.currency,
          productType: "live",
          category: normalizeCategorySlug(live.category?.slug ?? live.category?.name),
          creatorName: live.creator.creatorProfile?.displayName ?? `${live.creator.firstName} ${live.creator.lastName}`.trim(),
          sessionStatus: "draft",
          accessPolicy: paymentAccessPolicy,
          paymentMethods: [],
          paymentProcessingAvailable: false,
          ...breakdown
        };
      }
      case "content": {
        const content = await this.db.premiumContent.findUnique({
          where: { id: input.productId },
          include: {
            creator: {
              include: { creatorProfile: true }
            },
            category: true
          }
        });
        if (!content) {
          throw new AppError("Premium content unavailable.", 404);
        }
        const amount = toNumber(content.price);
        const breakdown = await commissionBreakdown(amount);
        return {
          id: content.id,
          title: content.title,
          amount,
          currency: content.currency,
          productType: "content",
          category: normalizeCategorySlug(content.category?.slug ?? content.category?.name),
          creatorName: content.creator.creatorProfile?.displayName ?? content.creator.id,
          sessionStatus: "draft",
          accessPolicy: paymentAccessPolicy,
          paymentMethods: [],
          paymentProcessingAvailable: false,
          ...breakdown
        };
      }
      case "class": {
        const learningClass = await this.db.learningClass.findUnique({
          where: { id: input.productId },
          include: {
            creator: {
              include: { creatorProfile: true }
            },
            category: true
          }
        });
        if (!learningClass) {
          throw new AppError("Class unavailable.", 404);
        }
        const amount = toNumber(learningClass.price);
        const breakdown = await commissionBreakdown(amount);
        return {
          id: learningClass.id,
          title: learningClass.title,
          amount,
          currency: learningClass.currency,
          productType: "class",
          category: normalizeCategorySlug(learningClass.category?.slug ?? learningClass.category?.name),
          creatorName: learningClass.creator.creatorProfile?.displayName ?? learningClass.creator.id,
          sessionStatus: "draft",
          accessPolicy: paymentAccessPolicy,
          paymentMethods: [],
          paymentProcessingAvailable: false,
          ...breakdown
        };
      }
    }

    throw new AppError("Unsupported checkout product.", 400);
  }

  async requestPayout(actor: Actor, input: { amount: number; method: string; note?: string }) {
    if (actor.role !== "admin") {
      const creatorProfile = await this.db.creatorProfile.findUnique({
        where: { userId: actor.userId },
        select: { verificationStatus: true, payoutEligible: true }
      });

      if (!creatorProfile) {
        throw new AppError("Complete your creator profile before requesting payouts.", 403);
      }

      if (creatorProfile.verificationStatus !== "approved" || !creatorProfile.payoutEligible) {
        throw new AppError("Creator verification must be approved before requesting payouts.", 403);
      }
    }

    const walletSummary = await this.walletsService
      .getMyWalletSummary(actor.userId)
      .catch(() => null as Awaited<ReturnType<WalletsService["getMyWalletSummary"]>> | null);
    const payoutCurrency =
      typeof walletSummary?.currency === "string" && walletSummary.currency.trim()
        ? walletSummary.currency
        : env.DEFAULT_CURRENCY;

    await this.walletsService.requestPayout(
      { userId: actor.userId, role: actor.role as "creator" | "admin" },
      input.amount,
      payoutCurrency
    );

    await this.db.notification.create({
      data: {
        userId: actor.userId,
        type: "system_alert",
        title: "Payout request submitted",
        body: `Your ${input.method} payout request for ${input.amount.toFixed(2)} ${payoutCurrency} is now under review.`
      }
    });

    return {
      message: "Payout request submitted successfully."
    };
  }

  private async getViewerTransactions(userId: string) {
    const grants = await this.db.accessGrant.findMany({
      where: {
        userId
      },
      orderBy: { createdAt: "desc" }
    });

    const titleMap = await this.loadGrantTitleMap(grants);

    return listResponse(
      grants.map((item) => ({
        id: item.id,
        type: "purchase",
        title: titleMap.get(item.id) ?? "Access purchase",
        amount: toNumber(item.price),
        currency: item.currency ?? env.DEFAULT_CURRENCY,
        status: item.status === "active" ? "paid" : item.status === "revoked" ? "refunded" : "pending",
        createdAt: item.createdAt.toISOString()
      }))
    );
  }

  private async loadGrantTitleMap(grants: Array<{ id: string; targetType: string; targetId: string }>) {
    const liveIds = grants.filter((item) => item.targetType === "live_session").map((item) => item.targetId);
    const contentIds = grants.filter((item) => item.targetType === "premium_content").map((item) => item.targetId);
    const classIds = grants.filter((item) => item.targetType === "class").map((item) => item.targetId);

    const [lives, content, classes] = await Promise.all([
      liveIds.length
        ? this.db.liveSession.findMany({
            where: { id: { in: liveIds } },
            select: { id: true, title: true }
          })
        : Promise.resolve([]),
      contentIds.length
        ? this.db.premiumContent.findMany({
            where: { id: { in: contentIds } },
            select: { id: true, title: true }
          })
        : Promise.resolve([]),
      classIds.length
        ? this.db.learningClass.findMany({
            where: { id: { in: classIds } },
            select: { id: true, title: true }
          })
        : Promise.resolve([])
    ]);

    const titleByTargetId = new Map<string, string>([
      ...lives.map((item) => [item.id, item.title] as const),
      ...content.map((item) => [item.id, item.title] as const),
      ...classes.map((item) => [item.id, item.title] as const)
    ]);

    return new Map(grants.map((item) => [item.id, titleByTargetId.get(item.targetId) ?? "Access purchase"]));
  }

  private async getManagedContent(options: { creatorId?: string; limit?: number } = {}) {
    const limit = options.limit ?? 12;
    const creatorFilter = options.creatorId ? { creatorId: options.creatorId } : {};

    const [lives, content, classes] = await Promise.all([
      this.db.liveSession.findMany({
        where: creatorFilter,
        include: {
          creator: {
            include: { creatorProfile: true }
          },
          category: true
        },
        orderBy: { createdAt: "desc" },
        take: limit
      }),
      this.db.premiumContent.findMany({
        where: creatorFilter,
        include: {
          creator: {
            include: { creatorProfile: true }
          },
          category: true
        },
        orderBy: { createdAt: "desc" },
        take: limit
      }),
      this.db.learningClass.findMany({
        where: creatorFilter,
        include: {
          creator: {
            include: { creatorProfile: true }
          },
          category: true
        },
        orderBy: { createdAt: "desc" },
        take: limit
      })
    ]);

    const items = [
      ...lives.map((item) => ({
        id: item.id,
        kind: "live" as const,
        title: item.title,
        price: toNumber(item.price),
        currency: item.currency,
        status: item.status,
        category: normalizeCategorySlug(item.category?.slug ?? item.category?.name),
        creatorName: this.getCreatorDisplayName(item.creator),
        createdAt: item.createdAt.toISOString(),
        scheduleLabel: item.scheduledFor ? formatScheduleLabel(item.scheduledFor) : undefined,
        deliveryLabel: this.getLiveDeliveryLabel(item.roomMetadata)
      })),
      ...content.map((item) => ({
        id: item.id,
        kind: "content" as const,
        title: item.title,
        price: toNumber(item.price),
        currency: item.currency,
        status: item.status,
        category: normalizeCategorySlug(item.category?.slug ?? item.category?.name),
        creatorName: this.getCreatorDisplayName(item.creator),
        createdAt: item.createdAt.toISOString(),
        deliveryLabel: "Premium content"
      })),
      ...classes.map((item) => ({
        id: item.id,
        kind: "class" as const,
        title: item.title,
        price: toNumber(item.price),
        currency: item.currency,
        status: item.status,
        category: normalizeCategorySlug(item.category?.slug ?? item.category?.name),
        creatorName: this.getCreatorDisplayName(item.creator),
        createdAt: item.createdAt.toISOString(),
        scheduleLabel: formatScheduleLabel(item.startsAt, item.endsAt),
        deliveryLabel: "Structured class"
      }))
    ]
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, limit);

    return listResponse(items);
  }

  private async loadCreatorReviewStats(creatorIds: string[]) {
    if (!creatorIds.length) {
      return new Map<string, CreatorReviewStats>();
    }

    const grouped = await this.db.review.groupBy({
      by: ["targetId"],
      where: {
        targetType: "creator",
        targetId: {
          in: creatorIds
        }
      },
      _count: {
        _all: true
      },
      _avg: {
        rating: true
      }
    });

    return new Map(
      grouped.map((item) => [
        item.targetId,
        {
          rating: item._avg.rating ?? undefined,
          reviewCount: item._count._all
        }
      ])
    );
  }

  private getCreatorDisplayName(user: { firstName: string; lastName: string; creatorProfile?: { displayName?: string | null } | null }) {
    return user.creatorProfile?.displayName ?? `${user.firstName} ${user.lastName}`.trim();
  }

  private getLiveDeliveryLabel(roomMetadata: unknown) {
    const metadata = (roomMetadata as Record<string, unknown> | null) ?? {};
    const sessionType = typeof metadata.sessionType === "string" ? metadata.sessionType : "video";

    if (sessionType === "audio") {
      return "Audio live";
    }

    if (sessionType === "both") {
      return "Audio + video live";
    }

    return "Video live";
  }

  private async toLiveSummaries(lives: LiveRecord[], actor?: Pick<Actor, "userId" | "role">) {
    const liveIds = lives.map((item) => item.id);
    const creatorIds = Array.from(new Set(lives.map((item) => item.creator.id)));
    const actorUserId = actor?.userId;
    const actorRole = actor?.role;

    const [viewerCounts, creatorStats, grants, follows, privateInvites] = await Promise.all([
      liveIds.length
        ? this.db.liveParticipant.groupBy({
            by: ["liveSessionId"],
            where: {
              liveSessionId: { in: liveIds },
              leftAt: null
            },
            _count: {
              _all: true
            }
          })
        : Promise.resolve([]),
      this.loadCreatorReviewStats(creatorIds),
      actorUserId && liveIds.length
        ? this.db.accessGrant.findMany({
            where: {
              userId: actorUserId,
              targetType: "live_session",
              targetId: { in: liveIds },
              status: "active"
            }
          })
        : Promise.resolve([]),
      actorUserId && creatorIds.length
        ? this.db.follow.findMany({
            where: {
              followerId: actorUserId,
              creatorId: { in: creatorIds }
            },
            select: { creatorId: true }
          })
        : Promise.resolve([]),
      actorUserId && liveIds.length
        ? this.db.accessGrant.findMany({
            where: {
              userId: actorUserId,
              targetId: { in: liveIds },
              status: "active",
              targetType: "private_live_invite"
            },
            select: { targetId: true }
          })
        : Promise.resolve([])
    ]);

    const viewerCountById = new Map(viewerCounts.map((item) => [item.liveSessionId, item._count._all]));
    const grantedIds = new Set(grants.map((item) => item.targetId));
    const followedCreatorIds = new Set(follows.map((item) => item.creatorId));
    const privateInviteIds = new Set(privateInvites.map((item) => item.targetId));

    return lives.map((item) => {
      const visibilityGranted =
        item.visibility === "public"
          ? true
          : item.visibility === "followers_only"
            ? followedCreatorIds.has(item.creatorId)
            : privateInviteIds.has(item.id) || grantedIds.has(item.id);
      const paymentGranted = !item.isPaid || grantedIds.has(item.id);

      return {
        id: item.id,
        title: item.title,
        description: item.description ?? "",
        creator: this.toCreatorSummary(item.creator, creatorStats.get(item.creator.id)),
        category: normalizeCategorySlug(item.category?.slug ?? item.category?.name),
        price: toNumber(item.price),
        currency: readString(item.currency, env.DEFAULT_CURRENCY),
        isPaid: readBoolean(item.isPaid, toNumber(item.price) > 0),
        startTime: (item.startedAt ?? item.scheduledFor ?? item.createdAt).toISOString(),
        endTime: item.endedAt?.toISOString(),
        isLive: item.status === "live",
        visibility: item.visibility,
        viewerCount: viewerCountById.get(item.id) ?? 0,
        accessGranted:
          actorRole === "admin" ||
          actorRole === "moderator" ||
          item.creatorId === actorUserId ||
          (visibilityGranted && paymentGranted)
      };
    });
  }

  private async toPremiumContentSummary(content: ContentRecord, actorUserId?: string) {
    const grant = actorUserId && content.isPaid
      ? await this.db.accessGrant.findFirst({
          where: {
            userId: actorUserId,
            targetType: "premium_content",
            targetId: content.id,
            status: "active"
          }
        })
      : null;

    return {
      id: content.id,
      title: content.title,
      description: content.description ?? content.excerpt ?? "",
      creator: this.toCreatorSummary(content.creator, {
        rating: content.creator.creatorProfile?.averageRating
          ? toNumber(content.creator.creatorProfile.averageRating)
          : undefined,
        reviewCount: 0
      }),
      category: normalizeCategorySlug(content.category?.slug ?? content.category?.name),
      price: toNumber(content.price),
      currency: content.currency,
      accessGranted: content.creatorId === actorUserId || !content.isPaid || Boolean(grant),
      attachmentCount: content.contentAsset ? 1 : 0
    };
  }

  private async toClassSummary(learningClass: ClassRecord, actorUserId?: string) {
    const [grant, enrollment] = actorUserId && learningClass.isPaid
      ? await Promise.all([
          this.db.accessGrant.findFirst({
            where: {
              userId: actorUserId,
              targetType: "class",
              targetId: learningClass.id,
              status: "active"
            }
          }),
          this.db.enrollment.findUnique({
            where: {
              classId_userId: {
                classId: learningClass.id,
                userId: actorUserId
              }
            }
          })
        ])
      : [null, null];

    const accessGranted =
      learningClass.creatorId === actorUserId ||
      !learningClass.isPaid ||
      Boolean(grant) ||
      enrollment?.status === "active";

    return {
      id: learningClass.id,
      title: learningClass.title,
      description: learningClass.description ?? "",
      creator: this.toCreatorSummary(learningClass.creator, {
        rating: learningClass.creator.creatorProfile?.averageRating
          ? toNumber(learningClass.creator.creatorProfile.averageRating)
          : undefined,
        reviewCount: 0
      }),
      category: normalizeCategorySlug(learningClass.category?.slug ?? learningClass.category?.name),
      price: toNumber(learningClass.price),
      scheduleLabel: formatScheduleLabel(learningClass.startsAt, learningClass.endsAt),
      materials: [],
      lessons: learningClass.lessons.map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        durationLabel: lesson.scheduledFor ? formatScheduleLabel(lesson.scheduledFor, null) : "Self-paced",
        accessGranted: accessGranted || lesson.isPreview
      })),
      accessGranted
    };
  }

  private toCreatorSummary(user: CreatorRecord, stats?: CreatorReviewStats) {
    const profile = user.creatorProfile;

    if (!profile) {
      throw new AppError("Creator profile is missing.", 500);
    }

    return {
      id: user.id,
      displayName: profile.displayName,
      handle: profile.handle,
      headline: profile.headline ?? "",
      bio: profile.bio ?? undefined,
      avatarUrl: null,
      bannerUrl: null,
      verificationStatus: toVerificationStatus(profile.verificationStatus),
      rating: stats?.rating ?? (profile.averageRating ? toNumber(profile.averageRating) : undefined),
      followerCount: profile.followersCount,
      reviewCount: stats?.reviewCount ?? 0,
      categories: normalizeCategoryList(profile.focusCategories)
    };
  }

  private toUserAccount(user: CreatorRecord) {
    const roles = deriveUserRoles({
      role: user.role,
      hasCreatorProfile: Boolean(user.creatorProfile)
    });

    return {
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      username: user.username,
      role: user.role,
      roles,
      avatarUrl: user.avatarUrl ?? null,
      emailVerified: Boolean(user.emailVerifiedAt),
      profileCompleted: Boolean(user.profileCompletedAt),
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : undefined,
      gender: user.gender ?? undefined,
      customGender: user.customGender ?? undefined,
      authProviders: Array.isArray(user.identities) ? user.identities.map((identity: { provider: string }) => identity.provider) : []
    };
  }

  private toLedgerTransactionType(entryType: string) {
    if (entryType === "PAYOUT_SENT") {
      return "payout";
    }

    if (entryType === "PAYMENT_PENDING" || entryType === "FUNDS_RELEASED" || entryType === "ADJUSTMENT_CREDIT") {
      return "earning";
    }

    if (entryType === "ADJUSTMENT_DEBIT") {
      return "commission";
    }

    return "purchase";
  }
}
