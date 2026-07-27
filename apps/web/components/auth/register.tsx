"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parrotClient } from "@/lib/parrot";
import AuthLeftPanel from "@/components/auth/auth-panel";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await parrotClient.auth.signup({ name, email, password });
      // Don't attempt immediate login — email must be verified first.
      // Redirect to login with a banner telling the user to check their inbox.
      router.push("/auth/login?message=check-email");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
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
            Create your workspace
          </p>

          {/* Heading */}
          <h1 className="text-2xl font-bold tracking-tighter text-white mb-8">
            Get started.
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-[#0a0a0a] border border-[#1A1A1A] rounded-md px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors duration-200"
              />
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
                htmlFor="signup-password"
                className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0a0a0a] border border-[#1A1A1A] rounded-md px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors duration-200"
              />
              <p className="font-mono text-[10px] text-neutral-600">
                Min. 8 characters
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="font-mono text-xs text-red-400">{error}</p>
            )}

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer bg-white text-black py-3.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>

          {/* Cross-link */}
          <p className="mt-8 text-xs text-neutral-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-white hover:text-neutral-300 font-medium transition-colors"
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
