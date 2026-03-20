import type { PrismaClient } from "@prisma/client";

export class CreatorsRepository {
  constructor(private readonly db: PrismaClient) {}

  upsertProfile(userId: string, data: { handle: string; displayName: string; headline?: string; bio?: string; focusCategories: string[] }) {
    return this.db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { role: "creator" }
      });

      return tx.creatorProfile.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data
        }
      });
    });
  }

  getOwnProfile(userId: string) {
    return this.db.creatorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  getPublicProfile(handle: string) {
    return this.db.creatorProfile.findUnique({
      where: { handle },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true
          }
        }
      }
    });
  }
}

