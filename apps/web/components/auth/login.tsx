"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schema";
import { parrotClient } from "@/lib/parrot";
import notify from "@/lib/toast";
import AuthLeftPanel from "@/components/auth/auth-panel";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const verified = searchParams.get("verified") === "true";
  const checkEmail = searchParams.get("message") === "check-email";
  const urlError = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (verified) {
      notify.success("Email verified — you can now sign in.");
    }
    if (urlError) {
      notify.error(decodeURIComponent(urlError));
    }
  }, [verified, urlError]);

  const isVerificationError =
    error?.toLowerCase().includes("verify") ||
    urlError?.toLowerCase().includes("verify");

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (!result?.ok) {
      const errorMsg = result?.error ?? "Invalid email or password.";
      setError(errorMsg);
      notify.error(result?.error, errorMsg);
      return;
    }

    notify.success("Signed in successfully");

    const session = await getSession();
    const tenants = session?.user?.tenants ?? [];

    if (tenants.length > 0) {
      router.push(callbackUrl);
    } else {
      router.push("/create-workspace");
    }
    router.refresh();
  };

  const handleResend = async () => {
    const email = getValues("email");
    if (!email) {
      notify.error(null, "Please enter your email address to resend verification.");
      return;
    }
    setResending(true);
    try {
      await parrotClient.auth.resendVerification({ email });
      setResendSent(true);
      notify.success("Verification email sent", {
        description: "Check your inbox for the link.",
      });
    } catch (err) {
      setError("Failed to resend. Please try again.");
      notify.error(err, "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-[#191919] text-[#37352f] dark:text-[#ffffff] flex transition-colors duration-200">
      <AuthLeftPanel />

      {/* Right — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Mobile logo */}
        <Link
          href="/"
          className="lg:hidden flex items-center gap-2 font-bold text-xl tracking-tighter text-[#37352f] dark:text-[#ffffff] mb-12"
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
          <h1 className="text-2xl font-bold tracking-tighter text-[#37352f] dark:text-[#ffffff] mb-8">
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                autoComplete="email"
                {...register("email")}
                placeholder="jane@parrot.dev"
                className="w-full bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-4 py-3 text-sm text-[#37352f] dark:text-[#ffffff] placeholder-[#37352f]/40 dark:placeholder-[#777777] focus:outline-none focus:border-zinc-400 transition-colors duration-200"
              />
              {errors.email && (
                <p className="font-mono text-[11px] text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="login-password"
                className="block font-mono text-[10px] uppercase tracking-widest text-[#37352f]/60 dark:text-[#9b9b9b]"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-4 py-3 text-sm text-[#37352f] dark:text-[#ffffff] placeholder-[#37352f]/40 dark:placeholder-[#777777] focus:outline-none focus:border-zinc-400 transition-colors duration-200"
              />
              {errors.password && (
                <p className="font-mono text-[11px] text-red-400">{errors.password.message}</p>
              )}
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="font-mono text-[10px] text-neutral-500 hover:text-[#37352f] dark:hover:text-[#ffffff] transition-colors"
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
                    className="font-mono text-[10px] text-neutral-400 hover:text-[#37352f] dark:hover:text-[#ffffff] transition-colors disabled:opacity-40"
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
              className="w-full bg-[#37352f] dark:bg-white text-white dark:text-black py-3.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          {/* Cross-link */}
          <p className="mt-8 text-xs text-neutral-500">
            No account?{" "}
            <Link
              href="/auth/signup"
              className="text-[#37352f] dark:text-[#ffffff] hover:opacity-70 font-medium transition-opacity"
            >
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
