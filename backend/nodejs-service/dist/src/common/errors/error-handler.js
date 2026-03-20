"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../../config/logger");
const app_error_1 = require("./app-error");
function errorHandler(error, req, res, _next) {
    if (error instanceof zod_1.ZodError) {
        return res.status(422).json({
            message: "Validation failed.",
            issues: error.flatten()
        });
    }
    if (error instanceof app_error_1.AppError) {
        return res.status(error.statusCode).json({
            message: error.message,
            details: error.details
        });
    }
    logger_1.logger.error({ error, requestId: req.requestId }, "Unhandled request error.");
    return res.status(500).json({
        message: "Internal server error."
    });
}
