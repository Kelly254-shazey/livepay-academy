"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsCredentials = exports.socketCorsOrigin = exports.corsOriginDelegate = void 0;
exports.isAllowedCorsOrigin = isAllowedCorsOrigin;
const env_1 = require("./env");
const localOriginPatterns = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^https:\/\/localhost:\d+$/,
    /^https:\/\/127\.0\.0\.1:\d+$/
];
function isLocalDevelopmentOrigin(origin) {
    return localOriginPatterns.some((pattern) => pattern.test(origin));
}
function isConfiguredOrigin(origin) {
    if (env_1.env.CORS_ORIGIN === "*") {
        return true;
    }
    return env_1.env.CORS_ORIGIN.includes(origin);
}
function isAllowedCorsOrigin(origin) {
    if (!origin) {
        return true;
    }
    return isConfiguredOrigin(origin) || isLocalDevelopmentOrigin(origin);
}
exports.corsOriginDelegate = env_1.env.CORS_ORIGIN === "*"
    ? "*"
    : (origin, callback) => {
        if (isAllowedCorsOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Not allowed by CORS"));
    };
exports.socketCorsOrigin = env_1.env.CORS_ORIGIN === "*"
    ? "*"
    : [...env_1.env.CORS_ORIGIN, ...localOriginPatterns];
exports.corsCredentials = env_1.env.CORS_ORIGIN !== "*";
