import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { MediaAccessService } from "../../infrastructure/media/media-access.service";

export function createMediaRouter(service: MediaAccessService) {
  const router = Router();

  router.get(
    "/access/:token",
    asyncHandler(async (req, res) => {
      const { assetUrl } = service.resolveDeliveryUrl(String(req.params.token ?? ""));
      res.setHeader("Cache-Control", "private, no-store");
      res.redirect(302, assetUrl);
    })
  );

  return router;
}
