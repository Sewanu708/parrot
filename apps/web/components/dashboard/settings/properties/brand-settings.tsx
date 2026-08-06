"use client";

import { useState, useEffect } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { signOut } from "next-auth/react";
import notify from "@/lib/toast";
import { ErrorHandler } from "@/lib/utilities";
import { useUpdateProperty } from "@/hooks/use-settings";
import { Check } from "lucide-react";

const PRESET_COLORS = [
  { name: "Indigo", value: "#4f46e5" },
  { name: "Emerald", value: "#10b981" },
  { name: "Neutral Dark", value: "#171717" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Cyan", value: "#06b6d4" },
];

export function BrandSettings({
  propertyId,
  logoUrl,
  brandColor = "#4f46e5",
}: {
  propertyId?: string;
  logoUrl?: string;
  brandColor?: string;
}) {
  const [logo, setLogo] = useState<string | null>(logoUrl ?? null);
  const [selectedColor, setSelectedColor] = useState<string>(brandColor);

  const updatePropertyMutation = useUpdateProperty();

  useEffect(() => {
    if (logoUrl) setLogo(logoUrl);
    if (brandColor) setSelectedColor(brandColor);
  }, [logoUrl, brandColor]);

  const handleUploadComplete = async (res?: Array<{ url: string }>) => {
    if (!res || !res[0]) return;
    const uploadedUrl = res[0].url;
    setLogo(uploadedUrl);

    if (propertyId) {
      updatePropertyMutation.mutate(
        { propertyId, data: { logoUrl: uploadedUrl } },
        {
          onSuccess: () => notify.success("Logo updated successfully!"),
          onError: (err: unknown) => {
            const formattedError = ErrorHandler(err);
            notify.error(err, formattedError);
          },
        },
      );
    } else {
      notify.error("No active property found to update");
    }
  };

  const handleSaveColor = (colorToSave: string) => {
    setSelectedColor(colorToSave);
    if (propertyId) {
      updatePropertyMutation.mutate(
        { propertyId, data: { brandColor: colorToSave } },
        {
          onSuccess: () => notify.success("Brand color updated!"),
          onError: (err: unknown) => {
            const formattedError = ErrorHandler(err);
            notify.error(err, formattedError);
          },
        },
      );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 py-8 border-b border-[#e9e9e7] dark:border-[#2d2d2d] last:border-0">
      <div className="md:col-span-1 space-y-1">
        <h2 className="text-base font-semibold text-[#37352f] dark:text-[#ffffff]">
          Brand Identity
        </h2>
        <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
          Customize your widget's logo and accent colors to match your brand.
        </p>
      </div>

      <div className="md:col-span-2 space-y-8 max-w-xl">
        {/* Logo Section */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#37352f] dark:text-white uppercase tracking-wider">
            Widget Logo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-neutral-100 dark:bg-[#2d2d2d] flex items-center justify-center overflow-hidden border border-[#e9e9e7] dark:border-[#333333]">
              {logo ? (
                <img
                  src={logo}
                  alt="Brand Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-neutral-400">No logo</span>
              )}
            </div>

            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => {
                if (
                  error.message.includes("User is not authenticated") ||
                  error.message.includes("Unauthorized")
                ) {
                  notify.error("Session expired. Please log in again.");
                  signOut();
                } else {
                  notify.error(`Upload failed: ${error.message}`);
                }
              }}
              appearance={{
                button:
                  "bg-[#37352f] dark:bg-white text-white dark:text-black text-sm px-4 py-2 rounded font-medium focus-within:ring-0 after:bg-emerald-500",
                allowedContent:
                  "text-xs text-[#37352f]/40 dark:text-[#555555]",
              }}
            />
          </div>
        </div>

        {/* Brand Color Section */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#37352f] dark:text-white uppercase tracking-wider">
            Brand Accent Color
          </label>

          <div className="flex flex-wrap items-center gap-3">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleSaveColor(preset.value)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                  selectedColor.toLowerCase() === preset.value.toLowerCase()
                    ? "ring-2 ring-offset-2 ring-neutral-400 dark:ring-neutral-500 scale-105"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
              >
                {selectedColor.toLowerCase() === preset.value.toLowerCase() && (
                  <Check className="w-4 h-4 text-white drop-shadow-sm" />
                )}
              </button>
            ))}

            {/* Custom Color Input */}
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-neutral-200 dark:border-neutral-800">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleSaveColor(e.target.value)}
                className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                title="Custom color"
              />
              <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 uppercase">
                {selectedColor}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
