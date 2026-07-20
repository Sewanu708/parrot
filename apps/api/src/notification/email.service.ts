import { Resend } from "resend";
import { logger } from "../logger";
import { appError } from "../express/errors";
import { ERROR_CODE } from "../express/constant";
import { env } from "../shared/env";
import * as hbs from "handlebars";
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

const DEFAULT_FROM_EMAIL = env.DEFAULT_FROM_EMAIL;

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: EmailTemplate;
  context?: AUTH_VERIFICATION | AUTH_PASSWORD_RESET | AUTH_PASSWORD_RESET_CODE;
};

export type AUTH_VERIFICATION = {
  name: string;
  hash: string;
};

export type AUTH_PASSWORD_RESET = {
  name: string;
  hash: string;
};

export type AUTH_PASSWORD_RESET_CODE = {
  name: string;
  code: string;
  expiresInMins: number;
};

export enum EmailTemplate {
  VERIFICATION = "AUTH_VERIFICATION",
  PASSWORD_RESET = "AUTH_PASSWORD_RESET",
  PASSWORD_RESET_CODE = "AUTH_PASSWORD_RESET_CODE",
}

export class EmailService {
  private static _resend: Resend | null = null;
  private static get resend(): Resend {
    if (!this._resend) {
      this._resend = new Resend(env.RESEND_KEY);
    }
    return this._resend;
  }
  private static logoUrl =
    "https://bxhoiovlk4.ufs.sh/f/gJvTMDqMASDhk7KRySlfgWKnPdNbvXtpsMc4Z67OAm93LUBY";
  private static resolveTemplatePath(filename: string): string {
    const distPath = join(
      process.cwd(),
      "dist",
      "notification",
      "templates",
      filename,
    );
    if (existsSync(distPath)) {
      return distPath;
    }
    return join(process.cwd(), "src", "notification", "templates", filename);
  }

  private static renderHbs(
    filename: string,
    context: Record<string, unknown>,
  ): string {
    const filePath = this.resolveTemplatePath(filename);
    const raw = readFileSync(filePath, "utf-8");
    const template = hbs.compile(raw);
    return template({
      ...context,
      logoUrl: this.logoUrl,
      year: new Date().getFullYear(),
    });
  }

  private static async resolveTemplate(
    template: EmailTemplate,
    context: unknown,
  ): Promise<{ html: string; text: string }> {
    switch (template) {
      case EmailTemplate.VERIFICATION:
        const ctx = context as AUTH_VERIFICATION;
        const frontend_url = env.FRONTEND_URL;
        if (!frontend_url) {
          appError("Failed to send email", ERROR_CODE.INVLDDATA, {
            code: "SL00",
            details: "Email service not well configured",
          });
        }
        const redirect_uri = `${frontend_url}/authentication?token=${ctx.hash}`;

        return {
          html: this.renderHbs("email-verification.hbs", {
            name: ctx.name,
            redirect_uri,
          }),
          text: `Parrot Verify your email`,
        };

      case EmailTemplate.PASSWORD_RESET_CODE:
        const codeCtx = context as AUTH_PASSWORD_RESET_CODE;
        return {
          html: this.renderHbs("password-reset.hbs", {
            name: codeCtx.name,
            code: codeCtx.code,
            expiresInMins: codeCtx.expiresInMins,
          }),
          text: `Hi ${codeCtx.name}, your password reset code is ${codeCtx.code}. It expires in ${codeCtx.expiresInMins} minutes.`,
        };

      default:
        return { html: "", text: "" };
    }
  }

  static async sendEmail(options: SendEmailOptions) {
    try {
      let htmlBody = options.html || "";
      let textBody = options.text;

      if (options.template && options.context) {
        const resolved = await this.resolveTemplate(
          options.template,
          options.context,
        );
        htmlBody = resolved.html;
        textBody = resolved.text;
      }

      if (!htmlBody && !textBody) {
        appError(
          "Email body (html, text, or template) is required",
          ERROR_CODE.INVLDREQ,
        );
      }

      const { data, error } = await this.resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        // to: Array.isArray(options.to) ? options.to : [options.to],
        to: "sewanu708@gmail.com",
        subject: options.subject,
        html: htmlBody,
        text: textBody,
      });

      if (error) {
        logger.error(
          { error, options: { to: options.to, subject: options.subject } },
          "Failed to send email via Resend",
        );
        appError("Failed to send email", ERROR_CODE.APPERR, {
          details: error.message,
          context: { providerError: error },
        });
      }

      logger.info(
        { emailId: data?.id, to: options.to },
        "Email sent successfully",
      );
      return data;
    } catch (err: any) {
      if (err instanceof Error && "isApplicationError" in err) {
        throw err;
      }

      logger.error(
        { err, options: { to: options.to, subject: options.subject } },
        "Unexpected error in EmailService",
      );
      appError(
        "An unexpected error occurred while sending email",
        ERROR_CODE.APPERR,
        {
          details: JSON.stringify(err),
        },
      );
    }
  }
}
