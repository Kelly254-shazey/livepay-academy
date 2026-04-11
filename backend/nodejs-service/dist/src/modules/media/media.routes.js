"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMediaRouter = createMediaRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
function createMediaRouter(service) {
    const router = (0, express_1.Router)();
    router.get("/access/:token", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const { assetUrl } = service.resolveDeliveryUrl(String(req.params.token ?? ""));
        res.setHeader("Cache-Control", "private, no-store");
        res.redirect(302, assetUrl);
    }));
    return router;
}
