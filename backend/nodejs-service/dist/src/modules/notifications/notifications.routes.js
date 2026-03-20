"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationsRouter = createNotificationsRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const authorize_1 = require("../../common/middleware/authorize");
const notifications_schemas_1 = require("./notifications.schemas");
function createNotificationsRouter(service) {
    const router = (0, express_1.Router)();
    router.use(authenticate_1.authenticate);
    router.get("/", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.listMine(req.auth.userId);
        res.json(result);
    }));
    router.post("/:notificationId/read", (0, validate_1.validate)(notifications_schemas_1.notificationIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.markRead(req.auth.userId, (0, params_1.getStringParam)(req.params.notificationId));
        res.json(result);
    }));
    router.post("/announcements", (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(notifications_schemas_1.announcementSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.sendAnnouncement({ userId: req.auth.userId, role: req.auth.role }, req.body);
        res.status(201).json(result);
    }));
    return router;
}
