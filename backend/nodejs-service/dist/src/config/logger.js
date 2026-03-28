"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const env_1 = require("./env");
exports.logger = (0, pino_1.default)({
    name: "livegate-nodejs-service",
    level: env_1.env.NODE_ENV === "production" ? "info" : "debug",
    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.x-internal-api-key",
            "req.body.code",
            "req.body.email",
            "req.body.identifier",
            "req.body.idToken",
            "req.body.password",
            "req.body.refreshToken",
            "req.body.token"
        ],
        censor: "[redacted]"
    }
});
exports.httpLogger = (0, pino_http_1.default)({
    logger: exports.logger,
    customProps: (req) => ({ requestId: req.requestId })
});
