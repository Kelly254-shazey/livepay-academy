"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPrismaJson = toPrismaJson;
exports.toPrismaNullableJson = toPrismaNullableJson;
function toPrismaJson(value) {
    return value;
}
function toPrismaNullableJson(value) {
    if (value === undefined) {
        return undefined;
    }
    return value;
}
