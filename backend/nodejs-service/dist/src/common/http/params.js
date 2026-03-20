"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStringParam = getStringParam;
function getStringParam(value) {
    return Array.isArray(value) ? value[0] ?? "" : value;
}
