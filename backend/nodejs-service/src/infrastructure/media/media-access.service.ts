import jwt from "jsonwebtoken";

import { AppError } from "../../common/errors/app-error";
import { validateUrl } from "../../common/security/ssrf-protection";
import { env } from "../../config/env";

const MEDIA_TOKEN_AUDIENCE = "livegate-media";
const MEDIA_TOKEN_ISSUER = "livegate-nodejs-service";
const MEDIA_TOKEN_TTL = "5m";

export class MediaAccessService {
  createDeliveryUrl(input: {
    assetUrl?: string | null;
    resourceType: string;
    resourceId: string;
  }) {
    if (!input.assetUrl) {
      return undefined;
    }

    const token = jwt.sign(
      {
        kind: "media_delivery",
        assetUrl: this.validateSourceUrl(input.assetUrl),
        resourceType: input.resourceType,
        resourceId: input.resourceId
      },
      env.JWT_ACCESS_SECRET,
      {
        issuer: MEDIA_TOKEN_ISSUER,
        audience: MEDIA_TOKEN_AUDIENCE,
        algorithm: "HS256",
        expiresIn: MEDIA_TOKEN_TTL
      }
    );

    const apiBaseUrl = (env.PUBLIC_API_BASE_URL ?? env.APP_BASE_URL).replace(/\/+$/, "");
    return `${apiBaseUrl}/api/media/access/${encodeURIComponent(token)}`;
  }

  resolveDeliveryUrl(token: string) {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: MEDIA_TOKEN_ISSUER,
      audience: MEDIA_TOKEN_AUDIENCE,
      algorithms: ["HS256"]
    }) as jwt.JwtPayload;

    if (
      payload["kind"] !== "media_delivery" ||
      typeof payload["assetUrl"] !== "string" ||
      typeof payload["resourceType"] !== "string" ||
      typeof payload["resourceId"] !== "string"
    ) {
      throw new AppError("Invalid media access token.", 400);
    }

    return {
      assetUrl: this.validateSourceUrl(payload["assetUrl"]),
      resourceType: payload["resourceType"],
      resourceId: payload["resourceId"]
    };
  }

  validateSourceUrl(assetUrl: string) {
    try {
      return validateUrl(assetUrl).toString();
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Invalid media URL.",
        400
      );
    }
  }
}
