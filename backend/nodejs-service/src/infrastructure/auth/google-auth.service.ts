import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";

type GoogleTokenInfoResponse = {
  aud?: string;
  email?: string;
  email_verified?: string;
  family_name?: string;
  given_name?: string;
  name?: string;
  picture?: string;
  sub?: string;
};

export type GoogleIdentityProfile = {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export class GoogleAuthService {
  async verifyIdToken(idToken: string): Promise<GoogleIdentityProfile> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError("Google sign-in is not configured.", 503);
    }

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!response.ok) {
      throw new AppError("Google sign-in token is invalid.", 401);
    }

    const payload = await response.json() as GoogleTokenInfoResponse;

    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      throw new AppError("Google sign-in token audience mismatch.", 401);
    }

    if (!payload.sub || !payload.email) {
      throw new AppError("Google sign-in token is incomplete.", 401);
    }

    return {
      providerUserId: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: payload.email_verified === "true",
      fullName: payload.name,
      firstName: payload.given_name,
      lastName: payload.family_name,
      avatarUrl: payload.picture
    };
  }
}
