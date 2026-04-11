import { PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors/app-error';
import { AuditService } from '../../common/audit/audit.service';

export class FollowService {
  constructor(
    private readonly db: PrismaClient,
    private readonly auditService: AuditService,
  ) {}

  async followCreator(followerId: string, creatorId: string) {
    if (followerId === creatorId) {
      throw new AppError('You cannot follow yourself.', 400);
    }

    const creator = await this.db.creatorProfile.findUnique({
      where: { userId: creatorId },
    });

    if (!creator) {
      throw new AppError('Creator not found.', 404);
    }

    const existingFollow = await this.db.follow.findUnique({
      where: {
        followerId_creatorId: {
          followerId,
          creatorId,
        },
      },
    });

    if (existingFollow) {
      return {
        followed: false,
        message: 'Already following this creator.',
      };
    }

    await this.db.follow.create({
      data: {
        followerId,
        creatorId,
      },
    });

    // Update follower count
    await this.db.creatorProfile.update({
      where: { userId: creatorId },
      data: {
        followersCount: {
          increment: 1,
        },
      },
    });

    // Audit log
    await this.auditService.record({
      actorId: followerId,
      action: 'follow.created',
      resource: 'creator',
      resourceId: creatorId,
    });

    return {
      followed: true,
      message: 'Now following this creator.',
    };
  }

  async unfollowCreator(followerId: string, creatorId: string) {
    const follow = await this.db.follow.findUnique({
      where: {
        followerId_creatorId: {
          followerId,
          creatorId,
        },
      },
    });

    if (!follow) {
      throw new AppError('Not following this creator.', 404);
    }

    await this.db.follow.delete({
      where: {
        followerId_creatorId: {
          followerId,
          creatorId,
        },
      },
    });

    // Update follower count
    await this.db.creatorProfile.update({
      where: { userId: creatorId },
      data: {
        followersCount: {
          decrement: 1,
        },
      },
    });

    // Audit log
    await this.auditService.record({
      actorId: followerId,
      action: 'follow.deleted',
      resource: 'creator',
      resourceId: creatorId,
    });

    return {
      followed: false,
      message: 'Unfollowed this creator.',
    };
  }

  async isFollowing(followerId: string, creatorId: string): Promise<boolean> {
    const follow = await this.db.follow.findUnique({
      where: {
        followerId_creatorId: {
          followerId,
          creatorId,
        },
      },
    });

    return Boolean(follow);
  }

  async getFollowedCreators(userId: string, limit = 50, offset = 0) {
    const follows = await this.db.follow.findMany({
      where: { followerId: userId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            creatorProfile: {
              select: {
                handle: true,
                displayName: true,
                headline: true,
                verificationStatus: true,
                followersCount: true,
                averageRating: true,
              },
            },
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await this.db.follow.count({
      where: { followerId: userId },
    });

    return {
      items: follows.map((f) => ({
        id: f.creator.id,
        userId: f.creator.id,
        handle: f.creator.creatorProfile?.handle ?? f.creator.username,
        displayName:
          f.creator.creatorProfile?.displayName ??
          `${f.creator.firstName} ${f.creator.lastName}`.trim() ??
          f.creator.username,
        headline: f.creator.creatorProfile?.headline,
        verificationStatus: f.creator.creatorProfile?.verificationStatus ?? 'unverified',
        followerCount: f.creator.creatorProfile?.followersCount ?? 0,
        averageRating: f.creator.creatorProfile?.averageRating,
        followedAt: f.createdAt,
      })),
      pagination: {
        limit,
        offset,
        total,
      },
    };
  }
}
