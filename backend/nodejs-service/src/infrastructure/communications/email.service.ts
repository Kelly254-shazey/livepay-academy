import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailDispatchResult = {
  delivered: boolean;
  preview?: string;
};

export class EmailService {
  async send(message: EmailMessage): Promise<EmailDispatchResult> {
    if (env.EMAIL_PROVIDER === "log") {
      const preview = [
        `to=${message.to}`,
        `subject=${message.subject}`,
        "",
        message.text
      ].join("\n");

      logger.info({ emailPreview: preview }, "Email delivery preview generated.");
      return { delivered: false, preview };
    }

    if (!env.RESEND_API_KEY) {
      throw new AppError("Resend is not configured. Set RESEND_API_KEY or use EMAIL_PROVIDER=log.", 503);
    }

    const response = await fetch(`${env.RESEND_API_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text
      })
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body }, "Email delivery failed.");
      throw new AppError("Email delivery failed.", 502);
    }

    return { delivered: true };
  }
}
