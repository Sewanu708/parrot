"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createWorkspaceSchema,
  type CreateWorkspaceFormData,
} from "@/lib/schema";
import { parrotClient } from "@/lib/parrot";
import notify from "@/lib/toast";
import { ErrorHandler } from "@/lib/utilities";
import AuthLeftPanel from "@/components/auth/auth-panel";
import { useCreateTenant } from "@/hooks";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { UploadButton } from "@/lib/uploadthing";
import { Copy, Check } from "lucide-react";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { data: sessionData, update: updateSession } = useSession();
  const createTenant = useCreateTenant();
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(
    null,
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopySnippet = () => {
    if (!createdPropertyId) return;
    const snippet = `<script \n  src="http://localhost:3000/widget.js" \n  data-property-id="${createdPropertyId}">\n</script>`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        propertyName: data.propertyName,
        domain: data.domain || undefined,
        supportEmail: data.supportEmail || undefined,
        brandColor: data.brandColor || undefined,
        logoUrl: logoUrl || undefined,
      },
      {
        onSuccess: (responseData) => {
          parrotClient.setTenantId(responseData.id);
          notify.success("Workspace created successfully", {
            description: `Welcome to ${responseData.name}`,
          });
          updateSession({
            ...sessionData,
            user: {
              ...sessionData?.user,
              activeTenantId: responseData.id,
              tenants: [
                ...(sessionData?.user.tenants ?? []),
                { id: responseData.id, name: responseData.name },
              ],
            },
          });
          if (responseData.defaultPropertyId) {
            setCreatedPropertyId(responseData.defaultPropertyId);
          } else {
            router.push("/dashboard");
            router.refresh();
          }
        },
        onError: (err) => {
          const formattedError = ErrorHandler(err);
          notify.error(err, formattedError);
        },
      },
    );
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
            Step 2 of 2 • Setup Organization
          </p>

          {/* Heading */}
          <h1 className="text-2xl font-bold tracking-tighter text-[#37352f] dark:text-[#ffffff] mb-8">
            Create your workspace.
          </h1>

          {createdPropertyId ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <p className="text-sm text-neutral-400">
                  You're all set! Copy and paste this snippet into the{" "}
                  <code>&lt;head&gt;</code> of your website to install the
                  widget.
                </p>
              </div>
              <div className="bg-black border border-dash-border rounded-md p-4 overflow-x-auto relative group">
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="absolute top-2 right-2 p-1.5 bg-neutral-800/80 hover:bg-neutral-700 rounded-md text-neutral-400 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  title="Copy snippet"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap word-break pt-6 sm:pt-0">
                  {`<script 
  src="http://localhost:3000/widget.js" 
  data-property-id="${createdPropertyId}">
</script>`}
                </pre>
              </div>
              <button
                onClick={() => {
                  router.push("/dashboard");
                  router.refresh();
                }}
                className="w-full bg-[#37352f] dark:bg-white text-white dark:text-black py-3.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity duration-200 cursor-pointer"
              >
                Go to Dashboard →
              </button>
            </div>
          ) : (
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
                  className="w-full bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-4 py-3 text-sm text-[#37352f] dark:text-[#ffffff] placeholder-[#37352f]/40 dark:placeholder-[#777777] focus:outline-none focus:border-zinc-400 transition-colors duration-200"
                />
                {errors.name && (
                  <p className="font-mono text-[11px] text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Property Name */}
              <div className="space-y-2">
                <label
                  htmlFor="property-name"
                  className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                >
                  Property Name *
                </label>
                <input
                  id="property-name"
                  type="text"
                  {...register("propertyName")}
                  placeholder="Parrot Support Widget"
                  className="w-full bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-4 py-3 text-sm text-[#37352f] dark:text-[#ffffff] placeholder-[#37352f]/40 dark:placeholder-[#777777] focus:outline-none focus:border-zinc-400 transition-colors duration-200"
                />
                {errors.propertyName && (
                  <p className="font-mono text-[11px] text-red-400">
                    {errors.propertyName.message}
                  </p>
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
                  className="w-full bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-4 py-3 text-sm text-[#37352f] dark:text-[#ffffff] placeholder-[#37352f]/40 dark:placeholder-[#777777] focus:outline-none focus:border-zinc-400 transition-colors duration-200"
                />
                {errors.domain && (
                  <p className="font-mono text-[11px] text-red-400">
                    {errors.domain.message}
                  </p>
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
                  className="w-full bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-4 py-3 text-sm text-[#37352f] dark:text-[#ffffff] placeholder-[#37352f]/40 dark:placeholder-[#777777] focus:outline-none focus:border-zinc-400 transition-colors duration-200"
                />
                {errors.supportEmail && (
                  <p className="font-mono text-[11px] text-red-400">
                    {errors.supportEmail.message}
                  </p>
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
                <div className="flex gap-3 items-center bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md p-2.5">
                  <input
                    id="workspace-color"
                    type="color"
                    {...register("brandColor")}
                    className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-neutral-400">
                    {brandColor}
                  </span>
                </div>
                {errors.brandColor && (
                  <p className="font-mono text-[11px] text-red-400">
                    {errors.brandColor.message}
                  </p>
                )}
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Workspace Logo (Optional)
                </label>
                <div className="bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#333333] rounded-md p-4 flex flex-col items-center justify-center min-h-25">
                  {logoUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="h-12 w-12 object-contain rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoUrl(null)}
                        className="text-[10px] uppercase  cursor-pointer tracking-widest text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res: Array<{ url: string }>) => {
                        console.log(`This is uploader complete ${res}`);

                        setLogoUrl(res[0].url);
                        notify.success("Logo uploaded successfully");
                      }}
                      onUploadError={(error: Error) => {
                        notify.error(`Upload failed: ${error.message}`);
                      }}
                      appearance={{
                        button:
                          "ut-ready:bg-[#37352f] dark:ut-ready:bg-[#252525] ut-uploading:cursor-not-allowed bg-[#37352f] dark:bg-[#252525] text-white cursor-pointer border border-[#333333] hover:opacity-90 rounded-md text-xs px-4 py-2 transition-colors duration-200",
                        allowedContent: "hidden",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                id="workspace-submit"
                type="submit"
                disabled={createTenant.isPending}
                className="w-full bg-[#37352f] dark:bg-white text-white dark:text-black py-3.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {createTenant.isPending
                  ? "Creating workspace..."
                  : "Create workspace & launch →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
