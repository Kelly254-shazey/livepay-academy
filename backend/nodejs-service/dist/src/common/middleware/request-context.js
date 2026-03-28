"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContext = requestContext;
exports.getRequestContext = getRequestContext;
const async_hooks_1 = require("async_hooks");
const crypto_1 = require("crypto");
const domain_1 = require("../constants/domain");
const requestContextStorage = new async_hooks_1.AsyncLocalStorage();
function requestContext(req, res, next) {
    const requestId = req.header(domain_1.REQUEST_ID_HEADER) ?? (0, crypto_1.randomUUID)();
    req.requestId = requestId;
    res.setHeader(domain_1.REQUEST_ID_HEADER, requestId);
    requestContextStorage.run({ requestId }, () => {
        next();
    });
}
function getRequestContext() {
    return requestContextStorage.getStore();
}
