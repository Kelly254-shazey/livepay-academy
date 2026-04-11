"use strict";
/**
 * Comprehensive Audit Logging Service
 * Logs all critical events for compliance, security, and troubleshooting
 * Note: Payment-related auditing is delegated to Java service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComprehensiveAuditService = void 0;
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
const prisma_json_1 = require("../db/prisma-json");
function inferActionCategory(action, resourceType) {
    const normalizedAction = action.toLowerCase();
    const normalizedResource = resourceType.toLowerCase();
    if (normalizedAction.startsWith("auth.")) {
        return "auth";
    }
    if (normalizedAction.startsWith("payment.") ||
        normalizedResource.includes("payment") ||
        normalizedResource.includes("wallet")) {
        return "payment";
    }
    if (normalizedResource.includes("session")) {
        return "session";
    }
    if (normalizedAction.startsWith("moderation.") ||
        normalizedResource.includes("report") ||
        normalizedResource.includes("moderation")) {
        return "moderation";
    }
    if (normalizedAction.startsWith("security.") ||
        normalizedAction.includes("password") ||
        normalizedAction.includes("token")) {
        return "security";
    }
    if (normalizedResource.includes("content") ||
        normalizedResource.includes("class") ||
        normalizedResource.includes("lesson") ||
        normalizedResource.includes("live_session")) {
        return "content_access";
    }
    return "admin";
}
class ComprehensiveAuditService {
    prisma;
    javaServiceUrl = process.env.JAVA_SERVICE_URL || env_1.env.JAVA_FINANCE_URL;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Record a general audit log entry
     */
    async recordAudit(input) {
        try {
            const resourceType = input.resourceType || "unknown";
            return await this.prisma.auditLog.create({
                data: {
                    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    actorId: input.actorId,
                    actorRole: input.actorRole,
                    action: input.action,
                    actionCategory: inferActionCategory(input.action, resourceType),
                    resource: resourceType,
                    resourceType,
                    resourceId: input.resourceId,
                    status: input.status ?? "success",
                    statusCode: input.statusCode,
                    description: input.description,
                    ipAddress: input.ipAddress,
                    userAgent: input.userAgent,
                    metadata: (0, prisma_json_1.toPrismaNullableJson)(input.metadata),
                    changes: (0, prisma_json_1.toPrismaNullableJson)(input.changes),
                    errorMessage: input.errorMessage,
                    duration: input.duration
                }
            });
        }
        catch (error) {
            console.error("Failed to record audit log:", error);
            throw error;
        }
    }
    /**
     * Record session related events (login, logout, token refresh, etc)
     * Note: Delegated to Java service for production use
     */
    async recordSessionEvent(input) {
        // Log to Node.js audit table
        await this.recordAudit({
            actorId: input.userId,
            action: `session.${input.eventType}`,
            resourceType: "session",
            status: "success",
            ipAddress: input.ipAddress,
            metadata: {
                sessionId: input.sessionId,
                eventType: input.eventType,
                country: input.country,
                isSuspicious: input.isSuspicious,
                ...input.metadata,
            },
        });
        // Call Java service if available
        const action = this.toJavaSessionAction(input.eventType);
        if (action && this.shouldSyncUserScopedEvent(input.userId)) {
            this.callJavaAuditService("/session/record", {
                sessionId: input.sessionId,
                action,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                country: input.country,
                device: this.inferDevice(input.userAgent)
            }, input.userId).catch((err) => logger_1.logger.error({ error: err }, "Failed to sync with Java audit"));
        }
    }
    /**
     * Record payment transaction audit trail
     * Note: Delegated to Java service
     */
    async recordPaymentEvent(input) {
        // Log to Node.js audit table
        await this.recordAudit({
            actorId: input.userId,
            action: `payment.${input.action}`,
            resourceType: "payment",
            resourceId: input.paymentId,
            status: input.status || "success",
            metadata: {
                amount: input.amount,
                currency: input.currency,
                ...input.metadata,
            },
        });
        // Call Java service for detailed payment audit
        // Node payment method actions do not map directly to the Java payment audit enums.
        // Keep the source-of-truth record in Node unless a compatible Java event is introduced.
    }
    /**
     * Record content access (streaming, viewing, library usage)
     * Note: Delegated to Java service
     */
    async recordContentAccess(input) {
        // Log to Node.js audit table
        await this.recordAudit({
            actorId: input.userId,
            action: `content.${input.accessType}`,
            resourceType: input.contentType,
            resourceId: input.contentId,
            status: "success",
            metadata: {
                creatorId: input.creatorId,
                accessType: input.accessType,
                accessDuration: input.accessDuration,
                ...input.metadata,
            },
        });
        // Call Java service for content tracking
        const accessType = this.toJavaEnum(input.accessType);
        if (this.shouldSyncUserScopedEvent(input.userId)) {
            this.callJavaAuditService("/content/record", {
                contentId: input.contentId,
                contentType: input.contentType,
                accessType,
                ipAddress: input.ipAddress,
                country: input.metadata?.country,
                deviceType: this.inferDevice(input.userAgent),
                role: input.metadata?.role ?? "viewer",
                requiresPayment: Boolean(input.metadata?.requiresPayment),
                paymentVerified: Boolean(input.metadata?.paymentVerified)
            }, input.userId).catch((err) => logger_1.logger.error({ error: err }, "Failed to sync with Java audit"));
        }
    }
    /**
     * Get audit logs for a user
     */
    async getUserAuditLogs(userId, limit = 100, offset = 0) {
        return this.prisma.auditLog.findMany({
            where: { actorId: userId },
            orderBy: { timestamp: "desc" },
            take: limit,
            skip: offset
        });
    }
    /**
     * Get audit logs by action
     */
    async getAuditLogsByAction(action, limit = 50) {
        return this.prisma.auditLog.findMany({
            where: { action },
            orderBy: { timestamp: "desc" },
            take: limit
        });
    }
    /**
     * Get audit summary
     */
    async getAuditSummaryByAction(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const logs = await this.prisma.auditLog.findMany({
            where: {
                timestamp: { gte: startDate }
            },
            select: {
                action: true
            }
        });
        const summary = {};
        logs.forEach((log) => {
            summary[log.action] = (summary[log.action] || 0) + 1;
        });
        return summary;
    }
    /**
     * Archive old audit logs (for compliance and performance)
     */
    async archiveOldLogs(olderThanDays = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const archivedCount = await this.prisma.auditLog.deleteMany({
            where: {
                timestamp: { lt: cutoffDate }
            }
        });
        return archivedCount.count;
    }
    /**
     * Check for suspicious activity patterns
     */
    async detectSuspiciousPatterns(userId) {
        const reasons = [];
        let riskScore = 0;
        // Get auth-related failures from audit logs
        const recentFailures = await this.prisma.auditLog.findMany({
            where: {
                actorId: userId,
                action: { contains: "failed" }
            },
            orderBy: { timestamp: "desc" },
            take: 10
        });
        if (recentFailures.length >= 3) {
            reasons.push(`${recentFailures.length} failed attempts in recent history`);
            riskScore += 30;
        }
        // Check for unusual IP changes
        const recentIPs = await this.prisma.auditLog.findMany({
            where: {
                actorId: userId,
                action: { contains: "auth" }
            },
            select: { ipAddress: true },
            distinct: ["ipAddress"],
            take: 10
        });
        if (recentIPs.length > 5) {
            reasons.push("Activity from multiple different IP addresses");
            riskScore += 20;
        }
        // Check for activity outside business hours
        const now = new Date();
        const hour = now.getHours();
        if (hour < 6 || hour > 22) {
            reasons.push("Activity outside typical hours");
            riskScore += 10;
        }
        return {
            isSuspicious: riskScore >= 50,
            reasons,
            riskScore: Math.min(riskScore, 100)
        };
    }
    /**
     * Helper method to call Java audit service
     */
    async callJavaAuditService(endpoint, data, userId) {
        try {
            // Validate service URL to prevent SSRF
            if (!this.javaServiceUrl.startsWith(env_1.env.JAVA_FINANCE_URL)) {
                throw new Error('Invalid service URL');
            }
            const response = await fetch(`${this.javaServiceUrl}/api/v1/audit${endpoint}`, {
                method: "POST",
                headers: this.buildJavaHeaders(userId),
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                logger_1.logger.warn({
                    service: 'java-audit',
                    status: response.status
                }, "Audit service error");
            }
        }
        catch (error) {
            logger_1.logger.error({ error }, "Failed to call Java audit service");
        }
    }
    buildJavaHeaders(userId) {
        const headers = {
            "Content-Type": "application/json",
            "x-internal-api-key": env_1.env.INTERNAL_API_KEY,
            "x-source-service": "nodejs-service"
        };
        if (userId) {
            headers["User-ID"] = userId;
        }
        return headers;
    }
    shouldSyncUserScopedEvent(userId) {
        return Boolean(userId && userId !== "unknown");
    }
    toJavaSessionAction(eventType) {
        switch (eventType.trim().toLowerCase()) {
            case "login_success":
            case "login":
                return "LOGIN";
            case "logout":
                return "LOGOUT";
            case "timeout":
                return "TIMEOUT";
            case "login_failure":
            case "failed_login":
                return "FAILED_LOGIN";
            case "mfa_verified":
                return "MFA_VERIFIED";
            case "device_change":
                return "DEVICE_CHANGE";
            case "suspicious_activity":
                return "SUSPICIOUS_ACTIVITY";
            default:
                return null;
        }
    }
    toJavaEnum(value) {
        return value
            .trim()
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            .replace(/[\s-]+/g, "_")
            .toUpperCase();
    }
    inferDevice(userAgent) {
        const normalized = (userAgent ?? "").toLowerCase();
        if (normalized.includes("mobile") || normalized.includes("android") || normalized.includes("iphone")) {
            return "mobile";
        }
        if (normalized.includes("ipad") || normalized.includes("tablet")) {
            return "tablet";
        }
        return "web";
    }
}
exports.ComprehensiveAuditService = ComprehensiveAuditService;
