"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorsService = void 0;
const app_error_1 = require("../../common/errors/app-error");
class CreatorsService {
    repository;
    auditService;
    pythonClient;
    constructor(repository, auditService, pythonClient) {
        this.repository = repository;
        this.auditService = auditService;
        this.pythonClient = pythonClient;
    }
    async upsertProfile(userId, input) {
        await this.pythonClient.analyzeContent({
            title: input.displayName,
            description: [input.headline, input.bio].filter(Boolean).join(" "),
            contentType: "creator_profile"
        });
        const profile = await this.repository.upsertProfile(userId, input);
        await this.auditService.record({
            actorId: userId,
            actorRole: "creator",
            action: "creator.profile.upserted",
            resource: "creator_profile",
            resourceId: profile.id
        });
        return profile;
    }
    async getOwnProfile(userId) {
        const profile = await this.repository.getOwnProfile(userId);
        if (!profile) {
            throw new app_error_1.AppError("Creator profile not found.", 404);
        }
        const [recommendations, insights] = await Promise.all([
            this.pythonClient.getCreatorRecommendations(userId).catch(() => null),
            this.pythonClient.getCreatorInsights(userId).catch(() => null)
        ]);
        return {
            ...profile,
            analyticsSummary: {
                recommendations,
                insights
            }
        };
    }
    async getPublicProfile(handle) {
        const profile = await this.repository.getPublicProfile(handle);
        if (!profile) {
            throw new app_error_1.AppError("Creator profile not found.", 404);
        }
        return profile;
    }
}
exports.CreatorsService = CreatorsService;
