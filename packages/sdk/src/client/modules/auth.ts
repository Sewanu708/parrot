import type { HttpClient } from "../http";
import type {
  SignupInput,
  LoginInput,
  LoginResponse,
  ForgotPasswordInput,
  ResetPasswordInput,
  ResendVerificationInput,
  SuccessResponse,
} from "../../schema/auth";

export class AuthModule {
  constructor(private http: HttpClient) {}

  async signup(input: SignupInput) {
    return this.http.post<SuccessResponse>("/auth/signup", input);
  }

  async login(input: LoginInput) {
    const res = await this.http.post<LoginResponse>("/auth/login", input);
    if (res.data?.token) {
      this.http.setToken(res.data.token);
    }
    return res;
  }

  async verifyEmail(token: string) {
    return this.http.post<SuccessResponse>("/auth/verify-email", { token });
  }

  async resendVerification(input: ResendVerificationInput) {
    return this.http.post<SuccessResponse>("/auth/resend-verification", input);
  }

  async forgotPassword(input: ForgotPasswordInput) {
    return this.http.post<SuccessResponse>("/auth/forgot-password", input);
  }

  async resetPassword(input: ResetPasswordInput) {
    return this.http.post<SuccessResponse>("/auth/reset-password", input);
  }

  async getMe() {
    return this.http.get("/auth/me");
  }
}
