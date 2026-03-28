import { createHash } from "crypto";

import { AppError } from "../../common/errors/app-error";
import type { AppRedisClient } from "../../infrastructure/cache/redis";

const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_IDENTIFIER_LIMIT = 5;
const LOGIN_IP_LIMIT = 12;
const REGISTRATION_WINDOW_SECONDS = 60 * 60;
const REGISTRATION_IP_LIMIT = 10;
const EMAIL_VERIFICATION_REQUEST_WINDOW_SECONDS = 15 * 60;
const EMAIL_VERIFICATION_REQUEST_USER_LIMIT = 5;
const EMAIL_VERIFICATION_REQUEST_IP_LIMIT = 10;
const EMAIL_VERIFICATION_CONFIRM_WINDOW_SECONDS = 15 * 60;
const EMAIL_VERIFICATION_CONFIRM_IDENTIFIER_LIMIT = 10;
const EMAIL_VERIFICATION_CONFIRM_IP_LIMIT = 20;
const PASSWORD_RESET_REQUEST_WINDOW_SECONDS = 15 * 60;
const PASSWORD_RESET_REQUEST_IDENTIFIER_LIMIT = 5;
const PASSWORD_RESET_REQUEST_IP_LIMIT = 10;
const PASSWORD_RESET_CONFIRM_WINDOW_SECONDS = 15 * 60;
const PASSWORD_RESET_CONFIRM_IDENTIFIER_LIMIT = 10;
const PASSWORD_RESET_CONFIRM_IP_LIMIT = 20;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeKeyPart(value: string) {
  return sha256(value.trim().toLowerCase());
}

export class AuthSecurityService {
  constructor(private readonly cache: AppRedisClient) {}

  async assertLoginAllowed(identifier: string, ipAddress?: string) {
    const [identifierCount, ipCount] = await Promise.all([
      this.readCounter(this.loginIdentifierKey(identifier)),
      ipAddress ? this.readCounter(this.loginIpKey(ipAddress)) : Promise.resolve(0)
    ]);

    if (identifierCount >= LOGIN_IDENTIFIER_LIMIT || ipCount >= LOGIN_IP_LIMIT) {
      throw new AppError("Too many sign-in attempts. Try again in 15 minutes.", 429);
    }
  }

  async recordLoginFailure(identifier: string, ipAddress?: string) {
    await Promise.all([
      this.bumpCounter(this.loginIdentifierKey(identifier), LOGIN_WINDOW_SECONDS),
      ipAddress ? this.bumpCounter(this.loginIpKey(ipAddress), LOGIN_WINDOW_SECONDS) : Promise.resolve()
    ]);
  }

  async clearLoginFailures(identifier: string, ipAddress?: string) {
    const keys = [this.loginIdentifierKey(identifier)];

    if (ipAddress?.trim()) {
      keys.push(this.loginIpKey(ipAddress));
    }

    await this.cache.del(keys);
  }

  async assertRegistrationAllowed(ipAddress?: string) {
    if (!ipAddress?.trim()) {
      return;
    }

    const count = await this.readCounter(this.registrationIpKey(ipAddress));
    if (count >= REGISTRATION_IP_LIMIT) {
      throw new AppError("Too many registration attempts. Try again later.", 429);
    }
  }

  async recordRegistrationAttempt(ipAddress?: string) {
    if (!ipAddress?.trim()) {
      return;
    }

    await this.bumpCounter(this.registrationIpKey(ipAddress), REGISTRATION_WINDOW_SECONDS);
  }

  async assertEmailVerificationRequestAllowed(userId: string, ipAddress?: string) {
    const [userCount, ipCount] = await Promise.all([
      this.readCounter(this.emailVerificationRequestUserKey(userId)),
      ipAddress ? this.readCounter(this.emailVerificationRequestIpKey(ipAddress)) : Promise.resolve(0)
    ]);

    if (
      userCount >= EMAIL_VERIFICATION_REQUEST_USER_LIMIT ||
      ipCount >= EMAIL_VERIFICATION_REQUEST_IP_LIMIT
    ) {
      throw new AppError("Too many verification email requests. Try again later.", 429);
    }
  }

  async recordEmailVerificationRequest(userId: string, ipAddress?: string) {
    await Promise.all([
      this.bumpCounter(this.emailVerificationRequestUserKey(userId), EMAIL_VERIFICATION_REQUEST_WINDOW_SECONDS),
      ipAddress
        ? this.bumpCounter(this.emailVerificationRequestIpKey(ipAddress), EMAIL_VERIFICATION_REQUEST_WINDOW_SECONDS)
        : Promise.resolve()
    ]);
  }

  async assertEmailVerificationConfirmationAllowed(email: string, ipAddress?: string) {
    const [identifierCount, ipCount] = await Promise.all([
      this.readCounter(this.emailVerificationConfirmIdentifierKey(email)),
      ipAddress ? this.readCounter(this.emailVerificationConfirmIpKey(ipAddress)) : Promise.resolve(0)
    ]);

    if (
      identifierCount >= EMAIL_VERIFICATION_CONFIRM_IDENTIFIER_LIMIT ||
      ipCount >= EMAIL_VERIFICATION_CONFIRM_IP_LIMIT
    ) {
      throw new AppError("Too many verification attempts. Try again later.", 429);
    }
  }

  async recordEmailVerificationConfirmationFailure(email: string, ipAddress?: string) {
    await Promise.all([
      this.bumpCounter(
        this.emailVerificationConfirmIdentifierKey(email),
        EMAIL_VERIFICATION_CONFIRM_WINDOW_SECONDS
      ),
      ipAddress
        ? this.bumpCounter(this.emailVerificationConfirmIpKey(ipAddress), EMAIL_VERIFICATION_CONFIRM_WINDOW_SECONDS)
        : Promise.resolve()
    ]);
  }

  async clearEmailVerificationConfirmationFailures(email: string, ipAddress?: string) {
    const keys = [this.emailVerificationConfirmIdentifierKey(email)];

    if (ipAddress?.trim()) {
      keys.push(this.emailVerificationConfirmIpKey(ipAddress));
    }

    await this.cache.del(keys);
  }

  async assertPasswordResetRequestAllowed(email: string, ipAddress?: string) {
    const [identifierCount, ipCount] = await Promise.all([
      this.readCounter(this.passwordResetRequestIdentifierKey(email)),
      ipAddress ? this.readCounter(this.passwordResetRequestIpKey(ipAddress)) : Promise.resolve(0)
    ]);

    if (
      identifierCount >= PASSWORD_RESET_REQUEST_IDENTIFIER_LIMIT ||
      ipCount >= PASSWORD_RESET_REQUEST_IP_LIMIT
    ) {
      throw new AppError("Too many password reset requests. Try again later.", 429);
    }
  }

  async recordPasswordResetRequest(email: string, ipAddress?: string) {
    await Promise.all([
      this.bumpCounter(this.passwordResetRequestIdentifierKey(email), PASSWORD_RESET_REQUEST_WINDOW_SECONDS),
      ipAddress
        ? this.bumpCounter(this.passwordResetRequestIpKey(ipAddress), PASSWORD_RESET_REQUEST_WINDOW_SECONDS)
        : Promise.resolve()
    ]);
  }

  async assertPasswordResetConfirmationAllowed(email: string, ipAddress?: string) {
    const [identifierCount, ipCount] = await Promise.all([
      this.readCounter(this.passwordResetConfirmIdentifierKey(email)),
      ipAddress ? this.readCounter(this.passwordResetConfirmIpKey(ipAddress)) : Promise.resolve(0)
    ]);

    if (
      identifierCount >= PASSWORD_RESET_CONFIRM_IDENTIFIER_LIMIT ||
      ipCount >= PASSWORD_RESET_CONFIRM_IP_LIMIT
    ) {
      throw new AppError("Too many reset attempts. Try again later.", 429);
    }
  }

  async recordPasswordResetConfirmationFailure(email: string, ipAddress?: string) {
    await Promise.all([
      this.bumpCounter(this.passwordResetConfirmIdentifierKey(email), PASSWORD_RESET_CONFIRM_WINDOW_SECONDS),
      ipAddress
        ? this.bumpCounter(this.passwordResetConfirmIpKey(ipAddress), PASSWORD_RESET_CONFIRM_WINDOW_SECONDS)
        : Promise.resolve()
    ]);
  }

  async clearPasswordResetConfirmationFailures(email: string, ipAddress?: string) {
    const keys = [this.passwordResetConfirmIdentifierKey(email)];

    if (ipAddress?.trim()) {
      keys.push(this.passwordResetConfirmIpKey(ipAddress));
    }

    await this.cache.del(keys);
  }

  private async readCounter(key: string) {
    const raw = await this.cache.get(key);
    const value = Number(raw ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  private async bumpCounter(key: string, ttlSeconds: number) {
    const existing = await this.cache.get(key);
    const next = await this.cache.incr(key);

    if (existing === null) {
      await this.cache.set(key, String(next), { EX: ttlSeconds });
    }

    return next;
  }

  private loginIdentifierKey(identifier: string) {
    return `auth:login:identifier:${normalizeKeyPart(identifier)}`;
  }

  private loginIpKey(ipAddress: string) {
    return `auth:login:ip:${normalizeKeyPart(ipAddress)}`;
  }

  private registrationIpKey(ipAddress: string) {
    return `auth:register:ip:${normalizeKeyPart(ipAddress)}`;
  }

  private emailVerificationRequestUserKey(userId: string) {
    return `auth:verify-email:request:user:${normalizeKeyPart(userId)}`;
  }

  private emailVerificationRequestIpKey(ipAddress: string) {
    return `auth:verify-email:request:ip:${normalizeKeyPart(ipAddress)}`;
  }

  private emailVerificationConfirmIdentifierKey(email: string) {
    return `auth:verify-email:confirm:identifier:${normalizeKeyPart(email)}`;
  }

  private emailVerificationConfirmIpKey(ipAddress: string) {
    return `auth:verify-email:confirm:ip:${normalizeKeyPart(ipAddress)}`;
  }

  private passwordResetRequestIdentifierKey(email: string) {
    return `auth:password-reset:request:identifier:${normalizeKeyPart(email)}`;
  }

  private passwordResetRequestIpKey(ipAddress: string) {
    return `auth:password-reset:request:ip:${normalizeKeyPart(ipAddress)}`;
  }

  private passwordResetConfirmIdentifierKey(email: string) {
    return `auth:password-reset:confirm:identifier:${normalizeKeyPart(email)}`;
  }

  private passwordResetConfirmIpKey(ipAddress: string) {
    return `auth:password-reset:confirm:ip:${normalizeKeyPart(ipAddress)}`;
  }
}
