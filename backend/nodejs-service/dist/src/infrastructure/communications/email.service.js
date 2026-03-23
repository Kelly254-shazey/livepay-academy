"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const app_error_1 = require("../../common/errors/app-error");
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
class EmailService {
    async send(message) {
        if (env_1.env.EMAIL_PROVIDER === "log") {
            const preview = [
                `to=${message.to}`,
                `subject=${message.subject}`,
                "",
                message.text
            ].join("\n");
            logger_1.logger.info({ emailPreview: preview }, "Email delivery preview generated.");
            return { delivered: false, preview };
        }
        if (!env_1.env.RESEND_API_KEY) {
            throw new app_error_1.AppError("Resend is not configured. Set RESEND_API_KEY or use EMAIL_PROVIDER=log.", 503);
        }
        const response = await fetch(`${env_1.env.RESEND_API_BASE_URL}/emails`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${env_1.env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: env_1.env.EMAIL_FROM,
                to: [message.to],
                subject: message.subject,
                html: message.html,
                text: message.text
            })
        });
        if (!response.ok) {
            const body = await response.text();
            logger_1.logger.error({ status: response.status, body }, "Email delivery failed.");
            throw new app_error_1.AppError("Email delivery failed.", 502);
        }
        return { delivered: true };
    }
}
exports.EmailService = EmailService;
