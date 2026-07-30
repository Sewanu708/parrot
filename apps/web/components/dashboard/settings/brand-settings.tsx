"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { signOut } from "next-auth/react";
import { parrotClient } from "@/lib/parrot";
import { useSession } from "next-auth/react";
import notify from "@/lib/toast";

export function BrandSettings({ propertyId }: { propertyId?: string }) {
  const [logo, setLogo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUploadComplete = async (res: any) => {
    if (!res || !res[0]) return;
    const uploadedUrl = res[0].url;
    setLogo(uploadedUrl);

    // Ensure we have a propertyId to patch
    if (propertyId) {
      setIsSaving(true);
      try {
        await parrotClient.tenant.updateProperty(propertyId, { logoUrl: uploadedUrl });
        notify.success("Logo updated successfully!");
      } catch (err) {
        notify.error("Failed to save logo to property");
      } finally {
        setIsSaving(false);
      }
    } else {
      notify.error("No active property found to update");
    }
  };

  return (
    <div className="bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl p-6">
      <h2 className="text-lg font-semibold text-[#37352f] dark:text-[#ffffff] mb-4">
        Brand Identity
      </h2>
      <div className="flex items-start gap-8">
        <div className="flex-1">
          <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b] mb-4">
            Upload your company logo. This will be displayed on the chat widget to your visitors.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-[#2d2d2d] flex items-center justify-center overflow-hidden border border-[#e9e9e7] dark:border-[#333333]">
              {logo ? (
                <img src={logo} alt="Brand Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-gray-400">No logo</span>
              )}
            </div>
            
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => {
                if (error.message.includes("User is not authenticated") || error.message.includes("Unauthorized")) {
                  notify.error("Session expired. Please log in again.");
                  signOut();
                } else {
                  notify.error(`Upload failed: ${error.message}`);
                }
              }}
              appearance={{
                button: "bg-[#37352f] dark:bg-white text-white dark:text-black text-sm px-4 py-2 rounded font-medium focus-within:ring-0 after:bg-emerald-500",
                allowedContent: "text-xs text-[#37352f]/40 dark:text-[#555555]"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
