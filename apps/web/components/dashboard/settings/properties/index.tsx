"use client";

import { useQuery } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import { useState, useEffect } from "react";
import notify from "@/lib/toast";
import { BrandSettings } from "./brand-settings";
import { GeneralSettings } from "./general-settings";
import { BusinessHoursSettings } from "./business-hours";
import { Copy, Check, Plus, ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PropertyDto } from "@parrot/sdk";
import { useSessionUser } from "@/hooks";

export function PropertiesSettings() {
  const user = useSessionUser();
  const activeTenantId = user?.activeTenantId;

  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<"snippet" | "direct" | null>(
    null,
  );

  const { data: propertiesResponse, isLoading } = useQuery({
    queryKey: ["properties", activeTenantId],
    queryFn: () => parrotClient.tenant.getProperties(activeTenantId!),
    enabled: !!activeTenantId,
  });

  const properties = propertiesResponse?.data || [];

  const handleCopy = (text: string, type: "snippet" | "direct") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    notify.success(
      type === "snippet"
        ? "Installation snippet copied!"
        : "Direct chat URL copied!",
    );
    setTimeout(() => setCopiedType(null), 2000);
  };

  const activeProperty = properties.find((p) => p.id === activePropertyId);

  useEffect(() => {
    if (activePropertyId && properties.length > 0 && !activeProperty) {
      notify.error("Selected property was not found.");
      setActivePropertyId(null);
    }
  }, [activePropertyId, properties, activeProperty]);

  return (
    <>
      <h1 className="text-3xl font-bold text-[#37352f] dark:text-[#ffffff] mb-2">
        Properties
      </h1>
      <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b] mb-8">
        Manage your widget properties and installation sources.
      </p>

      {!activePropertyId ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#37352f] dark:text-[#ffffff]">
              Your Properties
            </h2>
            <Button size="sm" className="gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" />
              New Property
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl p-5 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-md shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer flex flex-col gap-4"
                  onClick={() => setActivePropertyId(property.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-[#252525] flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5">
                        {property.logoUrl ? (
                          <img
                            src={property.logoUrl}
                            className="w-5 h-5 object-contain"
                            alt="Logo"
                          />
                        ) : (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: property.brandColor || "#4f46e5",
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-[#37352f] dark:text-white truncate">
                          {property.name}
                        </h3>
                        <p className="text-xs text-[#37352f]/60 dark:text-[#9b9b9b] truncate">
                          {property.domain || "No domain"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                </div>
              ))}

              {properties.length === 0 && (
                <div className="col-span-full py-8 text-center border border-dashed border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl">
                  <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
                    No properties found.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePropertyId(null)}
            className="w-fit pl-0 gap-2 cursor-pointer text-[#37352f]/60 dark:text-[#9b9b9b] hover:text-[#37352f] dark:hover:text-white hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Properties
          </Button>

          <div className="flex items-center justify-between border-b border-[#e9e9e7] dark:border-[#2d2d2d] pb-4">
            <h2 className="text-xl font-bold text-[#37352f] dark:text-[#ffffff]">
              {activeProperty?.name}
            </h2>
          </div>

          <div className="flex flex-col">
            {activeProperty && <GeneralSettings property={activeProperty} />}

            {/* Website Installation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 py-8 border-b border-[#e9e9e7] dark:border-[#2d2d2d]">
              <div className="md:col-span-1 space-y-1">
                <h2 className="text-base font-semibold text-[#37352f] dark:text-[#ffffff]">
                  Website Installation
                </h2>
                <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
                  Copy and paste this snippet before the closing{" "}
                  <code>&lt;/head&gt;</code> tag on your website.
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="bg-black border border-dash-border rounded-md p-4 overflow-x-auto relative group">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `<!-- Parrot Live Chat Widget -->\n<script src="https://cdn.parrot.app/parrot.js"></script>\n<script>\n  window.parrot = new Parrot({\n    propertyId: "${activeProperty?.id}"\n  });\n</script>`,
                        "snippet",
                      )
                    }
                    className="absolute top-2 right-2 p-1.5 bg-neutral-800/80 hover:bg-neutral-700 rounded-md text-neutral-400 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Copy snippet"
                  >
                    {copiedType === "snippet" ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap word-break pt-6 sm:pt-0">
                    {`<!-- Parrot Live Chat Widget -->\n<script src="https://cdn.parrot.app/parrot.js"></script>\n<script>\n  window.parrot = new Parrot({\n    propertyId: "${activeProperty?.id}"\n  });\n</script>`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Direct Browser Chat Link */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 py-8 border-b border-[#e9e9e7] dark:border-[#2d2d2d]">
              <div className="md:col-span-1 space-y-1">
                <h2 className="text-base font-semibold text-[#37352f] dark:text-[#ffffff]">
                  Direct Browser Chat
                </h2>
                <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
                  Share this link directly with customers via email, SMS, or
                  social bios for instant chat without needing a website.
                </p>
              </div>
              <div className="md:col-span-2 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#f7f7f5] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-md px-3.5 py-2.5 text-xs font-mono text-[#37352f] dark:text-[#ffffff] truncate select-all">
                    {activeProperty?.directChatUrl ||
                      (activeProperty?.id
                        ? `https://cdn.parrot.app/src/embed/embed.html?propertyId=${activeProperty.id}`
                        : "Generating link...")}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopy(
                        activeProperty?.directChatUrl ||
                          `https://cdn.parrot.app/src/embed/embed.html?propertyId=${activeProperty?.id}`,
                        "direct",
                      )
                    }
                    className="gap-1.5 shrink-0 cursor-pointer h-10 px-3"
                  >
                    {copiedType === "direct" ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copiedType === "direct" ? "Copied" : "Copy Link"}
                  </Button>
                  {(activeProperty?.directChatUrl || activeProperty?.id) && (
                    <a
                      href={
                        activeProperty?.directChatUrl ||
                        `https://cdn.parrot.app/src/embed/embed.html?propertyId=${activeProperty?.id}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-xs font-medium rounded-md border border-[#e9e9e7] dark:border-[#2d2d2d] bg-white dark:bg-[#191919] hover:bg-[#f7f7f5] dark:hover:bg-[#252525] text-[#37352f] dark:text-white transition-colors cursor-pointer shrink-0"
                      title="Open chat in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview
                    </a>
                  )}
                </div>
              </div>
            </div>

            <BrandSettings
              logoUrl={activeProperty?.logoUrl ?? undefined}
              brandColor={activeProperty?.brandColor ?? undefined}
              propertyId={activeProperty?.id}
            />
            {activeProperty?.id && (
              <BusinessHoursSettings propertyId={activeProperty.id} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
