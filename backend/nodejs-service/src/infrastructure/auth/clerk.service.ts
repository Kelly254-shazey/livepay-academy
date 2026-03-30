/**
 * Clerk Integration Service
 * Handles Clerk session verification and sync to the internal database
 */

import { createClerkClient, verifyToken } from "@clerk/backend";
import type { ClerkClient, User as ClerkBackendUser } from "@clerk/backend";
import type { Prisma, PrismaClient, UserRole } from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";

type ClerkEmailAddress = {
  id?: string;
  emailAddress?: string;
  email_address?: string;
  verification?: {
    status?: string | null;
  } | null;
};

type ClerkExternalAccount = {
  provider?: string | null;
  providerUserId?: string;
  provider_user_id?: string;
};

export type ClerkUser = {
  id: string;
  primaryEmailAddressId?: string | null;
  primary_email_address_id?: string | null;
  emailAddresses?: ClerkEmailAddress[];
  email_addresses?: ClerkEmailAddress[];
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  imageUrl?: string | null;
  profile_image_url?: string | null;
  publicMetadata?: Record<string, unknown>;
  public_metadata?: Record<string, unknown>;
  externalAccounts?: ClerkExternalAccount[];
  external_accounts?: ClerkExternalAccount[];
};

type VerifiedClerkToken = {
  sub: string;
  email: string;
  email_verified: boolean;
  sid?: string;
};

type NormalizedClerkUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  publicMetadata: Record<string, unknown>;
  googleProviderUserId: string;
};

export class ClerkService {
  private clerkClient?: ClerkClient;

  isConfigured() {
    return Boolean(env.CLERK_SECRET_KEY);
  }

  /**
   * Verify a Clerk session token from the client.
   */
  async verifyToken(token: string): Promise<VerifiedClerkToken | null> {
    try {
      this.assertConfigured();
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
        authorizedParties: this.getAuthorizedParties()
      });

      if (!payload.sub) {
        return null;
      }

      const clerkUser = await this.getUser(payload.sub);
      if (!clerkUser) {
        return null;
      }

      const normalized = this.normalizeUser(clerkUser);
      return {
        sub: normalized.id,
        email: normalized.email,
        email_verified: normalized.emailVerified,
        sid: typeof payload.sid === "string" ? payload.sid : undefined
      };
    } catch (error) {
      console.error("Clerk token verification failed:", error);
      return null;
    }
  }

  /**
   * Verify a Clerk Google session and return the normalized profile.
   */
  async verifyGoogleSession(token: string) {
    this.assertConfigured();

    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
        authorizedParties: this.getAuthorizedParties()
      });

      if (!payload.sub) {
        throw new AppError("Clerk session is invalid.", 401);
      }

      const clerkUser = await this.getUser(payload.sub);
      if (!clerkUser) {
        throw new AppError("Clerk user could not be loaded.", 401);
      }

      return {
        sessionId: typeof payload.sid === "string" ? payload.sid : undefined,
        user: this.normalizeUser(clerkUser)
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error("Failed to verify Clerk session:", error);
      throw new AppError("Clerk session is invalid.", 401);
    }
  }

  /**
   * Get user from Clerk.
   */
  async getUser(clerkId: string): Promise<ClerkUser | null> {
    try {
      this.assertConfigured();
      const user = await this.getClient().users.getUser(clerkId);
      return this.fromBackendUser(user);
    } catch (error) {
      console.error("Failed to fetch Clerk user:", error);
      return null;
    }
  }

  /**
   * Update Clerk user metadata.
   */
  async updateUserMetadata(
    clerkId: string,
    metadata: Record<string, unknown>
  ): Promise<boolean> {
    try {
      this.assertConfigured();
      await this.getClient().users.updateUserMetadata(clerkId, {
        publicMetadata: metadata
      });
      return true;
    } catch (error) {
      console.error("Failed to update Clerk user metadata:", error);
      return false;
    }
  }

  /**
   * Sync Clerk Google user to the internal database.
   */
  async syncToDatabase(
    clerkUser: ClerkUser,
    database: PrismaClient,
    preferredRole: UserRole = "viewer"
  ) {
    const normalized = this.normalizeUser(clerkUser);

    try {
      return await database.$transaction(async (tx) => {
        const existingGoogleIdentity = await tx.authIdentity.findUnique({
          where: {
            provider_providerUserId: {
              provider: "google",
              providerUserId: normalized.googleProviderUserId
            }
          },
          include: {
            user: {
              include: { identities: true, creatorProfile: true }
            }
          }
        });

        const existingUser =
          existingGoogleIdentity?.user ??
          await tx.user.findUnique({
            where: { email: normalized.email },
            include: { identities: true, creatorProfile: true }
          });

        const userId = existingUser
          ? (await tx.user.update({
            where: { id: existingUser.id },
            data: {
              clerkId: normalized.id,
              clerkMetadata: normalized.publicMetadata as Prisma.InputJsonValue,
              firstName: normalized.firstName || existingUser.firstName,
              lastName: normalized.lastName || existingUser.lastName,
              avatarUrl: normalized.imageUrl || existingUser.avatarUrl,
              emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
              lastLoginAt: new Date()
            }
          })).id
          : await (async () => {
          const username = await this.generateAvailableUsername(tx, normalized.email);
          const createdUser = await tx.user.create({
            data: {
              email: normalized.email,
              username,
              firstName: normalized.firstName || "LiveGate",
              lastName: normalized.lastName || "User",
              clerkId: normalized.id,
              clerkMetadata: normalized.publicMetadata as Prisma.InputJsonValue,
              avatarUrl: normalized.imageUrl,
              role: preferredRole,
              emailVerifiedAt: new Date(),
              profileCompletedAt: null,
              lastLoginAt: new Date()
            }
          });

          if (preferredRole === "creator") {
            await tx.creatorProfile.create({
              data: {
                userId: createdUser.id,
                handle: createdUser.username,
                displayName: `${createdUser.firstName} ${createdUser.lastName}`.trim()
              }
            });
          }

          return createdUser.id;
        })();

        const googleIdentity = await tx.authIdentity.findUnique({
          where: {
            userId_provider: {
              userId,
              provider: "google"
            }
          }
        });

        if (!googleIdentity) {
          await tx.authIdentity.create({
            data: {
              userId,
              provider: "google",
              providerUserId: normalized.googleProviderUserId,
              email: normalized.email
            }
          });
        } else if (
          googleIdentity.providerUserId !== normalized.googleProviderUserId ||
          googleIdentity.email !== normalized.email
        ) {
          await tx.authIdentity.update({
            where: { id: googleIdentity.id },
            data: {
              providerUserId: normalized.googleProviderUserId,
              email: normalized.email
            }
          });
        }

        return tx.user.findUniqueOrThrow({
          where: { id: userId },
          include: { identities: true, creatorProfile: true }
        });
      });
    } catch (error) {
      console.error("Failed to sync Clerk user to database:", error);
      throw error;
    }
  }

  private getClient() {
    if (!this.clerkClient) {
      this.clerkClient = createClerkClient({
        secretKey: env.CLERK_SECRET_KEY
      });
    }

    return this.clerkClient;
  }

  private assertConfigured() {
    if (!env.CLERK_SECRET_KEY) {
      throw new AppError("Clerk authentication is not configured.", 503);
    }
  }

  private getAuthorizedParties() {
    const parties = new Set<string>();

    try {
      parties.add(new URL(env.APP_BASE_URL).origin);
    } catch {
      // Ignore invalid application base URLs.
    }

    if (Array.isArray(env.CORS_ORIGIN)) {
      for (const origin of env.CORS_ORIGIN) {
        if (origin !== "*") {
          parties.add(origin);
        }
      }
    }

    return parties.size ? Array.from(parties) : undefined;
  }

  private fromBackendUser(user: ClerkBackendUser): ClerkUser {
    return {
      id: user.id,
      primaryEmailAddressId: user.primaryEmailAddressId,
      emailAddresses: user.emailAddresses.map((emailAddress) => ({
        id: emailAddress.id,
        emailAddress: emailAddress.emailAddress,
        verification: emailAddress.verification
          ? {
              status: emailAddress.verification.status
            }
          : null
      })),
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      publicMetadata: (user.publicMetadata ?? {}) as Record<string, unknown>,
      externalAccounts: user.externalAccounts.map((account) => ({
        provider: account.provider,
        providerUserId: account.providerUserId
      }))
    };
  }

  private normalizeUser(clerkUser: ClerkUser): NormalizedClerkUser {
    const emailAddresses = clerkUser.emailAddresses ?? clerkUser.email_addresses ?? [];
    const primaryEmailId = clerkUser.primaryEmailAddressId ?? clerkUser.primary_email_address_id ?? null;
    const primaryEmail =
      emailAddresses.find((emailAddress) => emailAddress.id === primaryEmailId) ??
      emailAddresses[0];
    const email =
      primaryEmail?.emailAddress ??
      primaryEmail?.email_address ??
      "";

    if (!email) {
      throw new AppError("Clerk user does not have an email address.", 400);
    }

    const externalAccounts = clerkUser.externalAccounts ?? clerkUser.external_accounts ?? [];
    const googleAccount = externalAccounts.find((account) => account.provider === "google");

    return {
      id: clerkUser.id,
      email: email.toLowerCase(),
      emailVerified: primaryEmail?.verification?.status === "verified",
      firstName: clerkUser.firstName ?? clerkUser.first_name ?? null,
      lastName: clerkUser.lastName ?? clerkUser.last_name ?? null,
      imageUrl: clerkUser.imageUrl ?? clerkUser.profile_image_url ?? null,
      publicMetadata: (clerkUser.publicMetadata ?? clerkUser.public_metadata ?? {}) as Record<string, unknown>,
      googleProviderUserId: googleAccount?.providerUserId ?? googleAccount?.provider_user_id ?? clerkUser.id
    };
  }

  private async generateAvailableUsername(database: Pick<PrismaClient, "user">, email: string) {
    const base = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24) || "livegate_user";

    let candidate = base.length >= 3 ? base : `user_${base.padEnd(3, "0")}`;
    let suffix = 0;

    while (await database.user.findUnique({ where: { username: candidate } })) {
      suffix += 1;
      const suffixText = `${suffix}`;
      candidate = `${base.slice(0, Math.max(3, 32 - suffixText.length - 1))}_${suffixText}`;
    }

    return candidate;
  }
}
