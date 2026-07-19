import { RequestComponents, HandlerResult } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import { AuthRepository } from "./repository";
import {
  encryptText,
  generateRandomStr,
  hashPassword,
  decodeVerificationToken,
  verifyPassword,
} from "../../shared/utils/encryption";
import { EmailService, EmailTemplate } from "../../notification/email.service";
import { ONE_DAY, PRODUCT_NAME } from "../../shared/constant";
import { LoginResponse, SuccessResponse } from "@parrot/sdk";
import { randomBytes, randomInt } from "crypto";
import { redisClient } from "../../shared/redis";

export class AuthController {
  static async signup(req: RequestComponents): Promise<HandlerResult> {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await AuthRepository.getUserByEmail(email);
    if (existingUser) {
      appError("Email is already in use", ERROR_CODE.AUTHERR, {
        code: "SL02",
      });
    }

    // 3. Hash Password & Save to DB
    const hashedPassword = await hashPassword(password);
    const newUser = await AuthRepository.createUserWithCredentials(
      name,
      email,
      hashedPassword,
    );

    const expiresAt = Date.now() + ONE_DAY;
    const rawToken = `${generateRandomStr(4)}::${email}::${generateRandomStr(4)}::${expiresAt}`;
    const verificationToken = encryptText(rawToken);

    // 5. Send Verification Email
    void EmailService.sendEmail({
      to: newUser.email,
      subject: `Verify your email address - ${PRODUCT_NAME}`,
      template: EmailTemplate.VERIFICATION,
      context: { name: newUser.name, hash: verificationToken },
    });

    return {
      status: 201,
      message: "Please check your email to verify your account.",
      data: { userId: newUser.id },
    };
  }

  static async verifyEmail(req: RequestComponents): Promise<HandlerResult> {
    const { token } = req.query as { token?: string };

    if (!token) {
      appError("Verification token is missing.", ERROR_CODE.INVLDREQ);
    }

    const { email, expiresAt } = decodeVerificationToken(token);

    if (Date.now() > expiresAt) {
      appError(
        "Verification link has expired. Please request a new one.",
        ERROR_CODE.INVLDREQ,
        { code: "SL04" },
      );
    }

    const user = await AuthRepository.getUserByEmail(email);
    if (!user) {
      appError("User not found", ERROR_CODE.INVLDREQ, {
        code: "SL05",
      });
    }

    if (user.emailVerified) {
      return {
        status: 200,
        message: "Email is already verified.",
      };
    }

    await AuthRepository.verifyUserEmail(email);

    return {
      status: 200,
      message: "Email verified successfully.",
    };
  }

  static async login(
    req: RequestComponents,
  ): Promise<HandlerResult<LoginResponse>> {
    const { email, password } = req.body;
    const { IP, userAgent } = req.properties;

    const data = await AuthRepository.getUserWithPassword(email);

    if (!data) {
      appError("Invalid credentials provided", ERROR_CODE.AUTHERR, {
        code: "SL03",
      });
    }

    if (!data.account?.passwordHash) {
      appError(
        "This email is linked to a different sign-in method.",
        ERROR_CODE.AUTHERR,
        { code: "SL06" },
      );
    }

    const { user, account } = data;

    const isPasswordValid = await verifyPassword(
      password,
      account?.passwordHash ?? "",
    );
    if (!isPasswordValid) {
      appError("Invalid credentials provided", ERROR_CODE.AUTHERR, {
        code: "SL03",
      });
    }

    if (!user.emailVerified) {
      // You can decide whether to block login or just return a flag
      appError(
        "Please verify your email before logging in",
        ERROR_CODE.AUTHERR,
      );
    }

    // Create session token
    const sessionToken = randomBytes(32).toString("hex");
    const sessionExpiresAt = new Date(Date.now() + ONE_DAY * 30); // 30 days

    await AuthRepository.createSession(
      user.id,
      sessionToken,
      sessionExpiresAt,
      IP || undefined,
      userAgent,
    );

    return {
      status: 200,
      message: "Login successful",
      data: {
        token: sessionToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    };
  }

  static async resendVerificationEmail(
    req: RequestComponents,
  ): Promise<HandlerResult<SuccessResponse>> {
    const { email } = req.body;
    const user = await AuthRepository.getUserByEmail(email);

    if (!user) {
      // Return success even if not found to prevent enumeration
      return {
        status: 200,
        message:
          "If your email is registered, a verification link has been sent.",
        data: { message: "Success" },
      };
    }

    if (user.emailVerified) {
      appError("Email is already verified", ERROR_CODE.INVLDREQ, {
        code: "SL01",
      });
    }

    const expiresAt = Date.now() + ONE_DAY;
    const rawToken = `${generateRandomStr(4)}::${email}::${generateRandomStr(4)}::${expiresAt}`;
    const verificationToken = encryptText(rawToken);

    await EmailService.sendEmail({
      to: email,
      subject: `Verify your email for ${PRODUCT_NAME}`,
      template: EmailTemplate.VERIFICATION,
      context: { name: user.name, hash: verificationToken },
    });

    return {
      status: 200,
      message: "Verification email sent.",
      data: { message: "Success" },
    };
  }

  static async forgotPassword(
    req: RequestComponents,
  ): Promise<HandlerResult<SuccessResponse>> {
    const { email } = req.body;
    const data = await AuthRepository.getUserWithPassword(email);

    if (!data) {
      // Prevent enumeration
      return {
        status: 200,
        message:
          "If your email is registered, a password reset link has been sent.",
        data: { message: "Success" },
      };
    }

    const resetCode = String(randomInt(100000, 999999));

    await redisClient.set(`reset_password:${resetCode}`, email, {
      ttl: 900000,
    }); // 15 mins in ms

    await EmailService.sendEmail({
      to: email,
      subject: `Your Password Reset Code - ${PRODUCT_NAME}`,
      template: EmailTemplate.PASSWORD_RESET_CODE,
      context: { name: data.user.name, code: resetCode, expiresInMins: 15 },
    });

    return {
      status: 200,
      message: "Password reset email sent.",
      data: { message: "Success" },
    };
  }

  static async resetPassword(
    req: RequestComponents,
  ): Promise<HandlerResult<SuccessResponse>> {
    const { token, password } = req.body;

    const email = await redisClient.get<string>(`reset_password:${token}`);
    if (!email) {
      appError("Invalid or expired reset code.", ERROR_CODE.INVLDREQ, {
        code: "SL01",
      });
    }

    // Burn the code so it can never be used again
    await redisClient.del(`reset_password:${token}`);

    const data = await AuthRepository.getUserWithPassword(email);
    if (!data) {
      appError("User not found", ERROR_CODE.INVLDREQ, { code: "SL05" });
    }

    const newPasswordHash = await hashPassword(password);
    await AuthRepository.updatePassword(data.user.id, newPasswordHash);

    return {
      status: 200,
      message: "Password has been successfully reset.",
      data: { message: "Success" },
    };
  }
}
