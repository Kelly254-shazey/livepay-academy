"use strict";
/**
 * Profile Service
 * Handles user and creator profile updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const roles_1 = require("../../common/auth/roles");
class ProfileService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    /**
     * Update user profile
     */
    async updateUserProfile(userId, data) {
        const existingUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { settings: true }
        });
        const settings = existingUser?.settings && typeof existingUser.settings === "object" && !Array.isArray(existingUser.settings)
            ? { ...existingUser.settings }
            : {};
        const updateData = {};
        if (data.firstName !== undefined)
            updateData.firstName = data.firstName;
        if (data.lastName !== undefined)
            updateData.lastName = data.lastName;
        if (data.website !== undefined)
            updateData.website = data.website || null;
        if (data.location !== undefined)
            updateData.location = data.location;
        if (data.profilePhotoUrl !== undefined)
            updateData.profilePhotoUrl = data.profilePhotoUrl || null;
        if (data.coverPhotoUrl !== undefined)
            updateData.coverPhotoUrl = data.coverPhotoUrl || null;
        if (data.bio !== undefined) {
            settings.profileBio = data.bio ?? null;
            updateData.settings = settings;
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        await this.auditService.record({
            actorId: userId,
            action: "profile.user_updated",
            resource: "profile",
            resourceId: userId
        });
        // Return updated profile
        return this.getUserProfile(userId);
    }
    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                avatarUrl: true,
                profilePhotoUrl: true,
                coverPhotoUrl: true,
                website: true,
                location: true,
                dateOfBirth: true,
                gender: true,
                country: true,
                role: true,
                emailVerifiedAt: true,
                profileCompletedAt: true,
                settings: true,
                creatorProfile: {
                    select: {
                        id: true,
                        handle: true,
                        displayName: true,
                        headline: true,
                        bio: true,
                        profilePhotoUrl: true,
                        coverPhotoUrl: true,
                        website: true,
                        location: true,
                        socialLinks: true,
                        focusCategories: true,
                        verificationStatus: true,
                        followersCount: true,
                        averageRating: true,
                    },
                },
            },
        });
        if (!user) {
            return null;
        }
        // Build full response matching ProfileSettingsPayload interface
        const settings = user.settings || {};
        const roles = (0, roles_1.deriveUserRoles)({
            role: user.role,
            hasCreatorProfile: Boolean(user.creatorProfile)
        });
        const defaultRole = roles.includes(settings.defaultRole) ? settings.defaultRole : roles[0];
        const profileBio = (typeof settings.profileBio === "string" ? settings.profileBio : null) ??
            user.creatorProfile?.bio ??
            undefined;
        return {
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
            email: user.email,
            bio: profileBio,
            profilePhotoUrl: user.profilePhotoUrl || undefined,
            coverPhotoUrl: user.coverPhotoUrl || undefined,
            website: user.website || undefined,
            location: user.location || undefined,
            roles,
            defaultRole,
            notificationPreferences: {
                liveReminders: settings.liveReminders !== false,
                purchaseUpdates: settings.purchaseUpdates !== false,
                creatorAnnouncements: settings.creatorAnnouncements !== false,
                systemAlerts: settings.systemAlerts !== false,
            },
            appearancePreferences: {
                theme: settings.theme || 'system',
                compactMode: settings.compactMode || false,
            },
            privacyPreferences: {
                publicCreatorProfile: settings.publicCreatorProfile !== false,
                communityVisibility: settings.communityVisibility !== false,
            },
            payoutPreferences: settings.payoutPreferences || undefined,
        };
    }
    /**
     * Update creator profile
     */
    async updateCreatorProfile(userId, data) {
        // First ensure creator profile exists
        const creator = await this.prisma.creatorProfile.findUnique({
            where: { userId },
        });
        if (!creator) {
            throw new Error("Creator profile not found");
        }
        const updateData = {};
        if (data.displayName !== undefined)
            updateData.displayName = data.displayName;
        if (data.headline !== undefined)
            updateData.headline = data.headline;
        if (data.bio !== undefined)
            updateData.bio = data.bio;
        if (data.website !== undefined)
            updateData.website = data.website || null;
        if (data.location !== undefined)
            updateData.location = data.location;
        if (data.profilePhotoUrl !== undefined)
            updateData.profilePhotoUrl = data.profilePhotoUrl || null;
        if (data.coverPhotoUrl !== undefined)
            updateData.coverPhotoUrl = data.coverPhotoUrl || null;
        if (data.focusCategories !== undefined)
            updateData.focusCategories = data.focusCategories;
        if (data.socialLinks !== undefined)
            updateData.socialLinks = data.socialLinks;
        // Also update user profile fields
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                profilePhotoUrl: data.profilePhotoUrl || undefined,
                coverPhotoUrl: data.coverPhotoUrl || undefined,
                website: data.website || undefined,
                location: data.location,
            },
        });
        const result = await this.prisma.creatorProfile.update({
            where: { userId },
            data: updateData,
            select: {
                id: true,
                userId: true,
                handle: true,
                displayName: true,
                headline: true,
                bio: true,
                profilePhotoUrl: true,
                coverPhotoUrl: true,
                website: true,
                location: true,
                socialLinks: true,
                focusCategories: true,
                verificationStatus: true,
                followersCount: true,
                averageRating: true,
            },
        });
        await this.auditService.record({
            actorId: userId,
            action: "profile.creator_updated",
            resource: "creator_profile",
            resourceId: userId
        });
        return result;
    }
    /**
     * Get creator profile by handle or ID
     */
    async getCreatorProfile(searchBy, value) {
        const select = {
            id: true,
            userId: true,
            handle: true,
            displayName: true,
            headline: true,
            bio: true,
            profilePhotoUrl: true,
            coverPhotoUrl: true,
            website: true,
            location: true,
            socialLinks: true,
            focusCategories: true,
            verificationStatus: true,
            followersCount: true,
            averageRating: true,
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    country: true,
                },
            },
        };
        if (searchBy === "handle") {
            return this.prisma.creatorProfile.findUnique({
                where: { handle: value },
                select,
            });
        }
        return this.prisma.creatorProfile.findUnique({
            where: { userId: value },
            select: {
                ...select,
            },
        });
    }
}
exports.ProfileService = ProfileService;
