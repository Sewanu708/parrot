import expressHandler from "../../express/handler";
import { AuthController } from "./controller";
import { SignupSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema, ResendVerificationSchema } from "@parrot/sdk";
import { validateRequest } from "../../shared/middleware/validate";

export const signupRoute = expressHandler({
  method: "post",
  path: "/auth/signup",
  middlewares: [validateRequest({ body: SignupSchema })],
  handler: AuthController.signup,
});

export const verifyEmailRoute = expressHandler({
  method: "get",
  path: "/auth/verify-email",
  handler: AuthController.verifyEmail,
});

export const loginRoute = expressHandler({
  method: "post",
  path: "/auth/login",
  middlewares: [validateRequest({ body: LoginSchema })],
  handler: AuthController.login,
});

export const forgotPasswordRoute = expressHandler({
  method: "post",
  path: "/auth/forgot-password",
  middlewares: [validateRequest({ body: ForgotPasswordSchema })],
  handler: AuthController.forgotPassword,
});

export const resetPasswordRoute = expressHandler({
  method: "post",
  path: "/auth/reset-password",
  middlewares: [validateRequest({ body: ResetPasswordSchema })],
  handler: AuthController.resetPassword,
});

export const resendVerificationRoute = expressHandler({
  method: "post",
  path: "/auth/resend-verification",
  middlewares: [validateRequest({ body: ResendVerificationSchema })],
  handler: AuthController.resendVerificationEmail,
});

export const authRoutes = [
  signupRoute, 
  verifyEmailRoute, 
  loginRoute, 
  forgotPasswordRoute, 
  resetPasswordRoute, 
  resendVerificationRoute
];
