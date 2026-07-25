"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parrotClient } from "../../lib/parrot";
import { authStorage } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await parrotClient.auth.login({ email, password });

      if (res.data) {
        const { token, user, tenants, lastActiveTenantId } = res.data;
        const activeTenantId = lastActiveTenantId || tenants[0]?.id;

        authStorage.setSession(token, user, activeTenantId);

        if (!tenants || tenants.length === 0) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">
            🦜
          </div>
        </div>

        <h1 className="text-xl font-bold text-center text-slate-100 mb-1">Welcome back</h1>
        <p className="text-xs text-slate-400 text-center mb-6">
          Sign in to your Parrot support dashboard
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In ➔"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
