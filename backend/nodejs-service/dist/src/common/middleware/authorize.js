"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const app_error_1 = require("../errors/app-error");
function authorize(...roles) {
    return (req, _res, next) => {
        if (!req.auth) {
            return next(new app_error_1.AppError("Authentication required.", 401));
        }
        if (!roles.includes(req.auth.role)) {
            return next(new app_error_1.AppError("Forbidden.", 403));
        }
        next();
    };
}
