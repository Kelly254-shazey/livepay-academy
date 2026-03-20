import type { ReviewTargetType } from "@prisma/client";

import { AuditService } from "../../common/audit/audit.service";
import { AppError } from "../../common/errors/app-error";
import { ReviewsRepository } from "./reviews.repository";

export class ReviewsService {
  constructor(
    private readonly repository: ReviewsRepository,
    private readonly auditService: AuditService
  ) {}

  async upsertReview(actor: { userId: string; role: "viewer" | "creator" | "moderator" | "admin" }, input: { targetType: ReviewTargetType; targetId: string; rating: number; comment?: string }) {
    const targetExists = await this.repository.targetExists(input.targetType, input.targetId);
    if (!targetExists) {
      throw new AppError("Review target not found.", 404);
    }

    const review = await this.repository.upsertReview(actor.userId, input);
    await this.auditService.record({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "review.upserted",
      resource: input.targetType,
      resourceId: input.targetId,
      metadata: { rating: input.rating }
    });
    return review;
  }

  list(targetType: ReviewTargetType, targetId: string) {
    return this.repository.list(targetType, targetId);
  }
}
