"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategoriesRouter = createCategoriesRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const authorize_1 = require("../../common/middleware/authorize");
const categories_schemas_1 = require("./categories.schemas");
function createCategoriesRouter(service) {
    const router = (0, express_1.Router)();
    router.get("/", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const status = req.query.status === "archived" ? "archived" : req.query.status === "active" ? "active" : undefined;
        const result = await service.list(status);
        res.json(result);
    }));
    router.post("/", authenticate_1.authenticate, (0, authorize_1.authorize)("admin"), (0, validate_1.validate)(categories_schemas_1.createCategorySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.create({
            ...req.body,
            createdById: req.auth.userId
        });
        res.status(201).json(result);
    }));
    router.patch("/:categoryId", authenticate_1.authenticate, (0, authorize_1.authorize)("admin"), (0, validate_1.validate)(categories_schemas_1.updateCategorySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.update((0, params_1.getStringParam)(req.params.categoryId), req.body);
        res.json(result);
    }));
    return router;
}
