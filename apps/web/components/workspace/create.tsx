"use client"
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createWorkspaceSchema, type CreateWorkspaceFormData } from "@/lib/schema";
import { parrotClient } from "@/lib/parrot";
import notify from "@/lib/toast";
import AuthLeftPanel from "@/components/auth/auth-panel";
import { useCreateTenant } from "@/hooks";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const createTenant = useCreateTenant();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      brandColor: "#4f46e5",
    },
  });

  const brandColor = watch("brandColor", "#4f46e5");

  const onSubmit = (data: CreateWorkspaceFormData) => {
    createTenant.mutate(
      {
        name: data.name,
        domain: data.domain || undefined,
        supportEmail: data.supportEmail || undefined,
        brandColor: data.brandColor || undefined,
      },
      {
        onSuccess: (responseData) => {
          parrotClient.setTenantId(responseData.id);
          notify.success("Workspace created successfully", {
            description: `Welcome to ${responseData.name}`,
          });
          router.push("/dashboard");
          router.refresh();
        },
        onError: (err) => {
          notify.error(err, "Failed to create workspace");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-dash-bg text-dash-text flex transition-colors duration-200">
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
            Step 2 of 2 • Setup Organization
          </p>

          {/* Heading */}
          <h1 className="text-2xl font-bold tracking-tighter text-white mb-8">
            Create your workspace.
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Workspace / Company Name */}
            <div className="space-y-2">
              <label
                htmlFor="workspace-name"
                className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Workspace Name *
              </label>
              <input
                id="workspace-name"
                type="text"
                {...register("name")}
                placeholder="Parrot Corp"
                className="w-full bg-dash-panel border border-dash-border rounded-md px-4 py-3 text-sm text-dash-text placeholder-dash-muted focus:outline-none focus:border-zinc-400 transition-colors duration-200"
              />
              {errors.name && (
                <p className="font-mono text-[11px] text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Domain */}
            <div className="space-y-2">
              <label
                htmlFor="workspace-domain"
                className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Company Domain (Optional)
              </label>
              <input
                id="workspace-domain"
                type="text"
                {...register("domain")}
                placeholder="parrot.dev"
                className="w-full bg-dash-panel border border-dash-border rounded-md px-4 py-3 text-sm text-dash-text placeholder-dash-muted focus:outline-none focus:border-zinc-400 transition-colors duration-200"
              />
              {errors.domain && (
                <p className="font-mono text-[11px] text-red-400">{errors.domain.message}</p>
              )}
            </div>

            {/* Support Email */}
            <div className="space-y-2">
              <label
                htmlFor="workspace-email"
                className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Support Email (Optional)
              </label>
              <input
                id="workspace-email"
                type="email"
                {...register("supportEmail")}
                placeholder="support@parrot.dev"
                className="w-full bg-dash-panel border border-dash-border rounded-md px-4 py-3 text-sm text-dash-text placeholder-dash-muted focus:outline-none focus:border-zinc-400 transition-colors duration-200"
              />
              {errors.supportEmail && (
                <p className="font-mono text-[11px] text-red-400">{errors.supportEmail.message}</p>
              )}
            </div>

            {/* Brand Color */}
            <div className="space-y-2">
              <label
                htmlFor="workspace-color"
                className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Widget Brand Color
              </label>
              <div className="flex gap-3 items-center bg-dash-panel border border-dash-border rounded-md p-2.5">
                <input
                  id="workspace-color"
                  type="color"
                  {...register("brandColor")}
                  className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                />
                <span className="text-xs font-mono text-neutral-400">{brandColor}</span>
              </div>
              {errors.brandColor && (
                <p className="font-mono text-[11px] text-red-400">{errors.brandColor.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="workspace-submit"
              type="submit"
              disabled={createTenant.isPending}
              className="w-full bg-white text-black py-3.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createTenant.isPending
                ? "Creating workspace..."
                : "Create workspace & launch →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
