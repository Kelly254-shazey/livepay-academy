"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwaggerDocument = createSwaggerDocument;
function createSwaggerDocument() {
    const baseUrl = `http://${process.env.HOSTNAME || "localhost"}:${process.env.PORT || 3000}`;
    return {
        openapi: "3.1.0",
        info: {
            title: "LiveGate Main API",
            version: "1.0.0",
            description: "Public orchestration API for LiveGate."
        },
        servers: [{ url: process.env.NODE_ENV === "production" ? process.env.APP_BASE_URL || baseUrl : baseUrl }],
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
