import { AppError } from "../../common/errors/app-error";
import { AuditService } from "../../common/audit/audit.service";
import { PythonIntelligenceClient } from "../../infrastructure/integrations/python-intelligence.client";
import { CreatorsRepository } from "./creators.repository";

export class CreatorsService {
  constructor(
    private readonly repository: CreatorsRepository,
    private readonly auditService: AuditService,
    private readonly pythonClient: PythonIntelligenceClient
  ) {}

  async upsertProfile(userId: string, input: { handle: string; displayName: string; headline?: string; bio?: string; focusCategories: string[] }) {
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

  async getOwnProfile(userId: string) {
    const profile = await this.repository.getOwnProfile(userId);
    if (!profile) {
      throw new AppError("Creator profile not found.", 404);
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

  async getPublicProfile(handle: string) {
    const profile = await this.repository.getPublicProfile(handle);
    if (!profile) {
      throw new AppError("Creator profile not found.", 404);
    }

    return profile;
  }
}
