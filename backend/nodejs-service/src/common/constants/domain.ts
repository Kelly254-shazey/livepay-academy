import type { AccessGrantTargetType, UserRole } from "@prisma/client";

export const SUPPORTED_ROLES = ["viewer", "creator", "moderator", "admin"] as const satisfies readonly UserRole[];
export const SUPPORTED_CATEGORIES = [
  "Education",
  "Trading Education",
  "Business & Entrepreneurship",
  "Career Coaching",
  "Mentorship",
  "Fitness & Wellness",
  "Creative Skills",
  "Events & Workshops",
  "Premium Tutorials",
  "Entertainment Live"
] as const;

export const COMMISSION_RULE = {
  platformRate: 0.2,
  creatorRate: 0.8
} as const;

export const ACCESS_TARGETS = ["live_session", "premium_content", "class", "lesson", "private_live_invite"] as const satisfies readonly AccessGrantTargetType[];

export const INTERNAL_API_KEY_HEADER = "x-internal-api-key";
export const REQUEST_ID_HEADER = "x-request-id";
export const SOURCE_SERVICE_HEADER = "x-source-service";
export const REQUEST_TIMESTAMP_HEADER = "x-request-timestamp";
export const API_PREFIX = "/api/v1";
