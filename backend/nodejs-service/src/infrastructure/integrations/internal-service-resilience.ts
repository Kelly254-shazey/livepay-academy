import axios from "axios";

import { AppError } from "../../common/errors/app-error";
import { logger } from "../../config/logger";

type CircuitState = "closed" | "open" | "half_open";

type InternalServiceRequestOptions<T> = {
  service: string;
  operation: string;
  run: () => Promise<T>;
  breaker: IntegrationCircuitBreaker;
  retryAttempts?: number;
  baseDelayMs?: number;
};

export type IntegrationCircuitSnapshot = {
  state: CircuitState;
  failureCount: number;
  retryAfterMs?: number;
};

export class IntegrationCircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private openedUntil = 0;

  constructor(
    private readonly service: string,
    private readonly failureThreshold = 3,
    private readonly cooldownMs = 30_000
  ) {}

  snapshot(): IntegrationCircuitSnapshot {
    const retryAfterMs =
      this.state === "open" ? Math.max(this.openedUntil - Date.now(), 0) : undefined;

    return {
      state: this.state,
      failureCount: this.failureCount,
      retryAfterMs
    };
  }

  ensureAvailable(operation: string) {
    if (this.state !== "open") {
      return;
    }

    if (Date.now() >= this.openedUntil) {
      this.state = "half_open";
      return;
    }

    throw new AppError(
      `${formatServiceName(this.service)} is temporarily unavailable and could not ${operation}.`,
      503,
      {
        service: this.service,
        operation,
        circuit: this.snapshot()
      }
    );
  }

  markSuccess() {
    this.state = "closed";
    this.failureCount = 0;
    this.openedUntil = 0;
  }

  markFailure(operation: string, error: unknown) {
    this.failureCount += 1;

    if (this.state === "half_open" || this.failureCount >= this.failureThreshold) {
      this.state = "open";
      this.openedUntil = Date.now() + this.cooldownMs;

      logger.warn(
        {
          service: this.service,
          operation,
          circuit: this.snapshot(),
          error
        },
        "Internal service circuit opened."
      );
      return;
    }

    this.state = "closed";
  }
}

export async function executeInternalServiceRequest<T>({
  service,
  operation,
  run,
  breaker,
  retryAttempts = 0,
  baseDelayMs = 200
}: InternalServiceRequestOptions<T>) {
  breaker.ensureAvailable(operation);

  for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
    try {
      const result = await run();
      breaker.markSuccess();
      return result;
    } catch (error) {
      const canRetry = attempt < retryAttempts && isRetryableIntegrationError(error);

      if (canRetry) {
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        logger.warn(
          {
            service,
            operation,
            attempt: attempt + 1,
            retryDelayMs: delayMs,
            error
          },
          "Retrying internal service request."
        );
        await sleep(delayMs);
        continue;
      }

      breaker.markFailure(operation, error);
      throw mapIntegrationError(service, operation, breaker.snapshot(), error);
    }
  }

  throw new AppError(
    `${formatServiceName(service)} is temporarily unavailable and could not ${operation}.`,
    503,
    {
      service,
      operation,
      circuit: breaker.snapshot()
    }
  );
}

function isRetryableIntegrationError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  const statusCode = error.response.status;
  return statusCode === 408 || statusCode === 429 || statusCode >= 500;
}

function mapIntegrationError(
  service: string,
  operation: string,
  circuit: IntegrationCircuitSnapshot,
  error: unknown
) {
  if (error instanceof AppError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const remoteMessage = readRemoteMessage(error.response?.data);

    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return new AppError(
        remoteMessage ?? `Unable to ${operation}.`,
        statusCode,
        {
          service,
          operation,
          upstreamStatusCode: statusCode,
          circuit
        }
      );
    }

    return new AppError(
      remoteMessage ?? `${formatServiceName(service)} is temporarily unavailable and could not ${operation}.`,
      503,
      {
        service,
        operation,
        upstreamStatusCode: statusCode,
        circuit
      }
    );
  }

  return new AppError(
    `${formatServiceName(service)} is temporarily unavailable and could not ${operation}.`,
    503,
    {
      service,
      operation,
      circuit
    }
  );
}

function readRemoteMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  if ("detail" in payload && typeof payload.detail === "string") {
    return payload.detail;
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  if ("error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  return undefined;
}

function formatServiceName(service: string) {
  return service
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sleep(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
