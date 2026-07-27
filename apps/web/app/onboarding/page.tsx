"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parrotClient } from "../../lib/parrot";
import { authStorage } from "../../lib/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [brandColor, setBrandColor] = useState("#4f46e5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authStorage.initClientFromStorage();
    const token = authStorage.getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await parrotClient.tenant.create({
        name,
        domain: domain || undefined,
        supportEmail: supportEmail || undefined,
        brandColor: brandColor || undefined,
      });

      if (res.data) {
        authStorage.setTenantId(res.data.id);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">
            🏢
          </div>
        </div>

        <h1 className="text-xl font-bold text-center text-slate-100 mb-1">Create your workspace</h1>
        <p className="text-xs text-slate-400 text-center mb-6">
          Set up your organization's support workspace to start receiving customer chats
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Workspace / Company Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Domain (Optional)</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="acme.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Support Email (Optional)</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@acme.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Widget Brand Color</label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400">{brandColor}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-4"
          >
            {loading ? "Creating Workspace..." : "Create Workspace & Launch ➔"}
          </button>
        </form>
      </div>
    </div>
  );
}
