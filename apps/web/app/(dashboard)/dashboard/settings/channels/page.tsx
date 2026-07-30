"use client";

import { useQuery } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { BrandSettings } from "@/components/dashboard/settings/brand-settings";
import { GeneralSettings } from "@/components/dashboard/settings/general-settings";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChannelsPage() {
  const { data: session } = useSession();
  const activeTenantId = session?.user?.activeTenantId;

  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: propertiesResponse } = useQuery({
    queryKey: ["properties", activeTenantId],
    queryFn: () => parrotClient.tenant.getProperties(activeTenantId!),
    enabled: !!activeTenantId,
  });
  
  const properties = propertiesResponse?.data || [];

  const handleCopySnippet = (propertyId: string) => {
    const snippet = `<script \n  src="http://localhost:3000/widget.js" \n  data-property-id="${propertyId}">\n</script>`;
    navigator.clipboard.writeText(snippet);
    setCopiedId(propertyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeProperty = properties.find(p => p.id === activePropertyId);

  return (
    <div className="p-8 max-w-4xl mx-auto w-full mt-4">
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
            <Button size="sm">
              + New Property
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((property) => (
              <div 
                key={property.id} 
                className="bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer flex flex-col gap-4"
                onClick={() => setActivePropertyId(property.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-[#252525] flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5">
                      {property.logoUrl ? (
                        <img src={property.logoUrl} className="w-5 h-5 object-contain" />
                      ) : (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: property.brandColor || "#4f46e5" }} />
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
                <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">No properties found.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setActivePropertyId(null)}
            className="w-fit pl-0 gap-2 text-[#37352f]/60 dark:text-[#9b9b9b] hover:text-[#37352f] dark:hover:text-white hover:bg-transparent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Properties
          </Button>
          
          <div className="flex items-center justify-between border-b border-[#e9e9e7] dark:border-[#2d2d2d] pb-4">
            <h2 className="text-xl font-bold text-[#37352f] dark:text-[#ffffff]">
              {activeProperty?.name}
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {activeProperty && <GeneralSettings property={activeProperty} />}

            <div className="bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[#37352f] dark:text-[#ffffff] mb-2">
                Installation
              </h2>
              <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b] mb-4">
                Copy and paste this snippet into the <code>&lt;head&gt;</code> of your website to install the widget.
              </p>
              <div className="bg-black border border-dash-border rounded-md p-4 overflow-x-auto relative group">
                <button
                  type="button"
                  onClick={() => handleCopySnippet(activeProperty!.id)}
                  className="absolute top-2 right-2 p-1.5 bg-neutral-800/80 hover:bg-neutral-700 rounded-md text-neutral-400 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  title="Copy snippet"
                >
                  {copiedId === activeProperty!.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap word-break pt-6 sm:pt-0">
                  {`<script 
  src="http://localhost:3000/widget.js" 
  data-property-id="${activeProperty?.id}">
</script>`}
                </pre>
              </div>
            </div>

            <BrandSettings propertyId={activeProperty?.id} />
          </div>
        </div>
      )}
    </div>
  );
}
