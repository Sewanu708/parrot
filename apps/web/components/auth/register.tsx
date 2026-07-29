"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/lib/schema";
import { parrotClient } from "@/lib/parrot";
import AuthLeftPanel from "@/components/auth/auth-panel";
import { ErrorHandler } from "@/lib/utils";
import notify from "@/lib/toast";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    setError(null);

    try {
      await parrotClient.auth.signup(data);
      notify.success("Account created successfully", {
        description: "Check your inbox to verify your email before signing in.",
      });
      router.push("/auth/login?message=check-email");
    } catch (err) {
      const formattedError = ErrorHandler(err);
      setError(formattedError);
      notify.error(err, formattedError);
    } finally {
      setLoading(false);
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
            Create your account
          </p>

          {/* Heading */}
          <h1 className="text-2xl font-bold tracking-tighter text-[#37352f] dark:text-[#ffffff] mb-8">
            Get started.
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label
                htmlFor="signup-name"
                className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                {...register("name")}
                placeholder="Jane Doe"
                className="w-full bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-4 py-3 text-sm text-[#37352f] dark:text-[#ffffff] placeholder-[#37352f]/40 dark:placeholder-[#777777] focus:outline-none focus:border-zinc-400 transition-colors duration-200"
              />
              {errors.name && (
                <p className="font-mono text-[11px] text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="signup-email"
                className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Email Address
              </label>
              <input
                id="signup-email"
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
                htmlFor="signup-password"
                className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-4 py-3 text-sm text-[#37352f] dark:text-[#ffffff] placeholder-[#37352f]/40 dark:placeholder-[#777777] focus:outline-none focus:border-zinc-400 transition-colors duration-200"
              />
              {errors.password ? (
                <p className="font-mono text-[11px] text-red-400">{errors.password.message}</p>
              ) : (
                <p className="font-mono text-[10px] text-neutral-600">Min. 8 characters</p>
              )}
            </div>

            {/* Error */}
            {error && <p className="font-mono text-xs text-red-400">{error}</p>}

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer bg-[#37352f] dark:bg-white text-white dark:text-black py-3.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>

          {/* Cross-link */}
          <p className="mt-8 text-xs text-neutral-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[#37352f] dark:text-[#ffffff] hover:opacity-70 font-medium transition-opacity"
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
