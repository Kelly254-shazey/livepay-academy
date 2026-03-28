"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRouter = createHealthRouter;
const express_1 = require("express");
function createHealthRouter(db, redis, dependencies) {
    const router = (0, express_1.Router)();
    router.get("/", async (_req, res) => {
        const [database, cache, javaFinance, pythonIntelligence] = await Promise.all([
            db.$queryRawUnsafe("SELECT 1").then(() => "up").catch(() => "down"),
            redis.ping().then(() => "up").catch(() => "down"),
            dependencies?.javaFinance?.ping().then(() => "up").catch(() => "down") ?? Promise.resolve("unknown"),
            dependencies?.pythonIntelligence?.ping().then(() => "up").catch(() => "down") ?? Promise.resolve("unknown")
        ]);
        res.json({
            status: database === "up" &&
                cache === "up" &&
                (javaFinance === "up" || javaFinance === "unknown") &&
                (pythonIntelligence === "up" || pythonIntelligence === "unknown")
                ? "ok"
                : "degraded",
            services: {
                database,
                cache,
                javaFinance,
                pythonIntelligence
            },
            circuits: {
                javaFinance: dependencies?.javaFinance?.getIntegrationStatus?.() ?? null,
                pythonIntelligence: dependencies?.pythonIntelligence?.getIntegrationStatus?.() ?? null
            }
        });
    });
    return router;
}
