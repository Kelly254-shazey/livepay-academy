"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_PREFIX = exports.REQUEST_TIMESTAMP_HEADER = exports.SOURCE_SERVICE_HEADER = exports.REQUEST_ID_HEADER = exports.INTERNAL_API_KEY_HEADER = exports.ACCESS_TARGETS = exports.COMMISSION_RULE = exports.SUPPORTED_CATEGORIES = exports.SUPPORTED_ROLES = void 0;
exports.SUPPORTED_ROLES = ["viewer", "creator", "moderator", "admin"];
exports.SUPPORTED_CATEGORIES = [
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
];
exports.COMMISSION_RULE = {
    platformRate: 0.2,
    creatorRate: 0.8
};
exports.ACCESS_TARGETS = ["live_session", "premium_content", "class", "lesson", "private_live_invite"];
exports.INTERNAL_API_KEY_HEADER = "x-internal-api-key";
exports.REQUEST_ID_HEADER = "x-request-id";
exports.SOURCE_SERVICE_HEADER = "x-source-service";
exports.REQUEST_TIMESTAMP_HEADER = "x-request-timestamp";
exports.API_PREFIX = "/api/v1";
