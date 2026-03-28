"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationCircuitBreaker = void 0;
exports.executeInternalServiceRequest = executeInternalServiceRequest;
const axios_1 = __importDefault(require("axios"));
const app_error_1 = require("../../common/errors/app-error");
const logger_1 = require("../../config/logger");
class IntegrationCircuitBreaker {
    service;
    failureThreshold;
    cooldownMs;
    state = "closed";
    failureCount = 0;
    openedUntil = 0;
    constructor(service, failureThreshold = 3, cooldownMs = 30_000) {
        this.service = service;
        this.failureThreshold = failureThreshold;
        this.cooldownMs = cooldownMs;
    }
    snapshot() {
        const retryAfterMs = this.state === "open" ? Math.max(this.openedUntil - Date.now(), 0) : undefined;
        return {
            state: this.state,
            failureCount: this.failureCount,
            retryAfterMs
        };
    }
    ensureAvailable(operation) {
        if (this.state !== "open") {
            return;
        }
        if (Date.now() >= this.openedUntil) {
            this.state = "half_open";
            return;
        }
        throw new app_error_1.AppError(`${formatServiceName(this.service)} is temporarily unavailable and could not ${operation}.`, 503, {
            service: this.service,
            operation,
            circuit: this.snapshot()
        });
    }
    markSuccess() {
        this.state = "closed";
        this.failureCount = 0;
        this.openedUntil = 0;
    }
    markFailure(operation, error) {
        this.failureCount += 1;
        if (this.state === "half_open" || this.failureCount >= this.failureThreshold) {
            this.state = "open";
            this.openedUntil = Date.now() + this.cooldownMs;
            logger_1.logger.warn({
                service: this.service,
                operation,
                circuit: this.snapshot(),
                error
            }, "Internal service circuit opened.");
            return;
        }
        this.state = "closed";
    }
}
exports.IntegrationCircuitBreaker = IntegrationCircuitBreaker;
async function executeInternalServiceRequest({ service, operation, run, breaker, retryAttempts = 0, baseDelayMs = 200 }) {
    breaker.ensureAvailable(operation);
    for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
        try {
            const result = await run();
            breaker.markSuccess();
            return result;
        }
        catch (error) {
            const canRetry = attempt < retryAttempts && isRetryableIntegrationError(error);
            if (canRetry) {
                const delayMs = baseDelayMs * Math.pow(2, attempt);
                logger_1.logger.warn({
                    service,
                    operation,
                    attempt: attempt + 1,
                    retryDelayMs: delayMs,
                    error
                }, "Retrying internal service request.");
                await sleep(delayMs);
                continue;
            }
            breaker.markFailure(operation, error);
            throw mapIntegrationError(service, operation, breaker.snapshot(), error);
        }
    }
    throw new app_error_1.AppError(`${formatServiceName(service)} is temporarily unavailable and could not ${operation}.`, 503, {
        service,
        operation,
        circuit: breaker.snapshot()
    });
}
function isRetryableIntegrationError(error) {
    if (!axios_1.default.isAxiosError(error)) {
        return false;
    }
    if (!error.response) {
        return true;
    }
    const statusCode = error.response.status;
    return statusCode === 408 || statusCode === 429 || statusCode >= 500;
}
function mapIntegrationError(service, operation, circuit, error) {
    if (error instanceof app_error_1.AppError) {
        return error;
    }
    if (axios_1.default.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const remoteMessage = readRemoteMessage(error.response?.data);
        if (statusCode && statusCode >= 400 && statusCode < 500) {
            return new app_error_1.AppError(remoteMessage ?? `Unable to ${operation}.`, statusCode, {
                service,
                operation,
                upstreamStatusCode: statusCode,
                circuit
            });
        }
        return new app_error_1.AppError(remoteMessage ?? `${formatServiceName(service)} is temporarily unavailable and could not ${operation}.`, 503, {
            service,
            operation,
            upstreamStatusCode: statusCode,
            circuit
        });
    }
    return new app_error_1.AppError(`${formatServiceName(service)} is temporarily unavailable and could not ${operation}.`, 503, {
        service,
        operation,
        circuit
    });
}
function readRemoteMessage(payload) {
    if (!payload || typeof payload !== "object") {
        return undefined;
    }
    if ("detail" in payload && typeof payload.detail === "string") {
        return payload.detail;
    }
    if ("message" in payload && typeof payload.message === "string") {
        return payload.message;
    }
    if ("error" in payload && typeof payload.error === "string") {
        return payload.error;
    }
    return undefined;
}
function formatServiceName(service) {
    return service
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
function sleep(delayMs) {
    return new Promise((resolve) => {
        setTimeout(resolve, delayMs);
    });
}
