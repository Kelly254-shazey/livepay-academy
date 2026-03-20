"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewsRouter = createReviewsRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const reviews_schemas_1 = require("./reviews.schemas");
function createReviewsRouter(service) {
    const router = (0, express_1.Router)();
    router.get("/", (0, validate_1.validate)(reviews_schemas_1.listReviewsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.list(req.query.targetType, req.query.targetId);
        res.json(result);
    }));
    router.post("/", authenticate_1.authenticate, (0, validate_1.validate)(reviews_schemas_1.createReviewSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.upsertReview({ userId: req.auth.userId, role: req.auth.role }, req.body);
        res.status(201).json(result);
    }));
    return router;
}
