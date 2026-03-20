"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwaggerDocument = createSwaggerDocument;
const env_1 = require("./env");
function createSwaggerDocument() {
    return {
        openapi: "3.1.0",
        info: {
            title: "LiveGate Main API",
            version: "1.0.0",
            description: "Public orchestration API for LiveGate."
        },
        servers: [{ url: `http://localhost:${env_1.env.PORT}` }],
        tags: [
            { name: "health" },
            { name: "auth" },
            { name: "users" },
            { name: "creators" },
            { name: "categories" },
            { name: "live-sessions" },
            { name: "premium-content" },
            { name: "classes" },
            { name: "notifications" },
            { name: "access" },
            { name: "wallets" },
            { name: "reviews" },
            { name: "reports" },
            { name: "admin" }
        ]
    };
}
