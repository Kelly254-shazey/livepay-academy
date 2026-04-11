"use strict";
/**
 * Profile Routes
 * Handle user and creator profile operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProfileRouter = createProfileRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const profile_schemas_1 = require("./profile.schemas");
function createProfileRouter(profileService) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/profiles/me
     * Get current user's profile
     */
    router.get("/me", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
        const profile = await profileService.getUserProfile(req.auth.userId);
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }
        res.json({
            success: true,
            profile,
        });
    }));
    /**
     * PATCH /api/profiles/me
     * Update current user's profile
     */
    router.patch("/me", authenticate_1.authenticate, (0, validate_1.validate)(profile_schemas_1.profileUpdateSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const updatedProfile = await profileService.updateUserProfile(req.auth.userId, req.body);
        res.json({
            success: true,
            message: "Profile updated successfully",
            profile: updatedProfile,
        });
    }));
    /**
     * GET /api/profiles/creator/:handle
     * Get creator profile by handle (public endpoint)
     */
    router.get("/creator/:handle", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const handle = Array.isArray(req.params.handle) ? req.params.handle[0] : req.params.handle;
        const profile = await profileService.getCreatorProfile("handle", handle);
        if (!profile) {
            return res.status(404).json({ error: "Creator not found" });
        }
        res.json({
            success: true,
            profile,
        });
    }));
    /**
     * PATCH /api/profiles/creator/me
     * Update creator profile
     */
    router.patch("/creator/me", authenticate_1.authenticate, (0, validate_1.validate)(profile_schemas_1.creatorProfileUpdateSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const updatedProfile = await profileService.updateCreatorProfile(req.auth.userId, req.body);
        res.json({
            success: true,
            message: "Creator profile updated successfully",
            profile: updatedProfile,
        });
    }));
    return router;
}
