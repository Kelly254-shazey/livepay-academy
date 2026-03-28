import { AppError } from "../../common/errors/app-error";
import { AuditService } from "../../common/audit/audit.service";
import { PythonIntelligenceClient } from "../../infrastructure/integrations/python-intelligence.client";
import { UsersRepository } from "./users.repository";

export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly auditService: AuditService,
    private readonly pythonClient: PythonIntelligenceClient
  ) {}

  async getMe(userId: string) {
    const user = await this.repository.getUserProfile(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return user;
  }

  updateMe(userId: string, data: { firstName?: string; lastName?: string; settings?: Record<string, unknown> }) {
    return this.repository.updateUserProfile(userId, data);
  }

  async followCreator(followerId: string, creatorId: string) {
    if (followerId === creatorId) {
      throw new AppError("You cannot follow yourself.", 400);
    }

    return this.repository.createFollow(followerId, creatorId);
  }

  async unfollowCreator(followerId: string, creatorId: string) {
    await this.repository.deleteFollow(followerId, creatorId);
  }

  updateNotificationPreferences(userId: string, preferences: Record<string, boolean>) {
    return this.repository.updateNotificationPreferences(userId, preferences);
  }

  listPurchaseHistory(userId: string) {
    return this.repository.listPurchaseHistory(userId);
  }

  async getRecommendations(userId: string) {
    return this.pythonClient.getCreatorRecommendations(userId).catch(() => ({
      user_id: userId,
      generated_at: new Date().toISOString(),
      results: {
        creators: []
      }
    }));
  }
}
