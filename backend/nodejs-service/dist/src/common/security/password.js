"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const argon2_1 = __importDefault(require("argon2"));
function hashPassword(password) {
    return argon2_1.default.hash(password, {
        type: argon2_1.default.argon2id,
        memoryCost: 19 * 1024,
        timeCost: 3,
        parallelism: 1
    });
}
function verifyPassword(hash, password) {
    return argon2_1.default.verify(hash, password);
}
