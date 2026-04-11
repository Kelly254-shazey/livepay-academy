/**
 * Profile Routes
 * Handle user and creator profile operations
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../common/http/async-handler";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { ProfileService } from "./profile.service";
import { profileUpdateSchema, creatorProfileUpdateSchema } from "./profile.schemas";

export function createProfileRouter(profileService: ProfileService) {
  const router = Router();

  /**
   * GET /api/profiles/me
   * Get current user's profile
   */
  router.get(
    "/me",
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const profile = await profileService.getUserProfile(req.auth!.userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({
        success: true,
        profile,
      });
    })
  );

  /**
   * PATCH /api/profiles/me
   * Update current user's profile
   */
  router.patch(
    "/me",
    authenticate,
    validate(profileUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const updatedProfile = await profileService.updateUserProfile(
        req.auth!.userId,
        req.body
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        profile: updatedProfile,
      });
    })
  );

  /**
   * GET /api/profiles/creator/:handle
   * Get creator profile by handle (public endpoint)
   */
  router.get(
    "/creator/:handle",
    asyncHandler(async (req: Request, res: Response) => {
      const handle = Array.isArray(req.params.handle) ? req.params.handle[0] : req.params.handle;

      const profile = await profileService.getCreatorProfile("handle", handle);
      if (!profile) {
        return res.status(404).json({ error: "Creator not found" });
      }

      res.json({
        success: true,
        profile,
      });
    })
  );

  /**
   * PATCH /api/profiles/creator/me
   * Update creator profile
   */
  router.patch(
    "/creator/me",
    authenticate,
    validate(creatorProfileUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const updatedProfile = await profileService.updateCreatorProfile(
        req.auth!.userId,
        req.body
      );

      res.json({
        success: true,
        message: "Creator profile updated successfully",
        profile: updatedProfile,
      });
    })
  );

  return router;
}
