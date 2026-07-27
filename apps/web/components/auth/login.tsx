"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { parrotClient } from "@/lib/parrot";
import AuthLeftPanel from "@/components/auth/auth-panel";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const verified = searchParams.get("verified") === "true";
  const checkEmail = searchParams.get("message") === "check-email";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const isVerificationError =
    error?.toLowerCase().includes("verify") ||
    urlError?.toLowerCase().includes("verify");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result?.ok) {
      setError(result?.error ?? "Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await parrotClient.auth.resendVerification({ email });
      setResendSent(true);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      <AuthLeftPanel />

      {/* Right — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Mobile logo */}
        <Link
          href="/"
          className="lg:hidden flex items-center gap-2 font-bold text-xl tracking-tighter text-white mb-12"
        >
          parrot.
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </Link>

        <div className="w-full max-w-sm">
          {/* Mono label */}
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-5">
            Log in to Parrot
          </p>

          {/* Heading */}
          <h1 className="text-2xl font-bold tracking-tighter text-white mb-8">
            Welcome back.
          </h1>

          {/* Status banners */}
          {verified && (
            <div className="mb-6 px-4 py-3 border border-emerald-500/20 rounded-md bg-emerald-500/5">
              <p className="font-mono text-xs text-emerald-400">
                Email verified — you can now sign in.
              </p>
            </div>
          )}

          {checkEmail && (
            <div className="mb-6 px-4 py-3 border border-[#2a2a2a] rounded-md">
              <p className="font-mono text-xs text-neutral-400">
                Account created. Check your inbox to verify your email before signing in.
              </p>
            </div>
          )}

          {urlError && !verified && (
            <div className="mb-6 px-4 py-3 border border-red-500/20 rounded-md">
              <p className="font-mono text-xs text-red-400">{decodeURIComponent(urlError)}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full bg-[#0a0a0a] border border-[#1A1A1A] rounded-md px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors duration-200"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="login-password"
                className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0a0a0a] border border-[#1A1A1A] rounded-md px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors duration-200"
              />
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="font-mono text-[10px] text-neutral-500 hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="space-y-2">
                <p className="font-mono text-xs text-red-400">{error}</p>
                {isVerificationError && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || resendSent}
                    className="font-mono text-[10px] text-neutral-400 hover:text-white transition-colors disabled:opacity-40"
                  >
                    {resendSent
                      ? "✓ Verification email sent"
                      : resending
                      ? "Sending..."
                      : "Resend verification email →"}
                  </button>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-3.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          {/* Cross-link */}
          <p className="mt-8 text-xs text-neutral-500">
            No account?{" "}
            <Link
              href="/auth/signup"
              className="text-white hover:text-neutral-300 font-medium transition-colors"
            >
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
