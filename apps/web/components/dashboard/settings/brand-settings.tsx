"use client";

import { useEffect, useState } from "react";
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
] as const;

interface BrandSettingsProps {
  propertyId?: string;
  logoUrl?: string;
  brandColor?: string;
}

export function BrandSettings({
  propertyId,
  logoUrl,
  brandColor = "#4f46e5",
}: BrandSettingsProps) {
  const [logo, setLogo] = useState<string | null>(logoUrl ?? null);
  const [selectedColor, setSelectedColor] = useState(brandColor);

  const { mutate: updateProperty, isPending } = useUpdateProperty();

  // Keep local state in sync if the parent passes new server data
  useEffect(() => {
    setLogo(logoUrl ?? null);
    setSelectedColor(brandColor);
  }, [logoUrl, brandColor]);

  // Single place that actually talks to the server
  const savePropertyField = (
    data: { logoUrl: string } | { brandColor: string },
    successMessage: string,
  ) => {
    if (!propertyId) {
      notify.error("No active property found to update");
      return;
    }
    updateProperty(
      { propertyId, data },
      {
        onSuccess: () => notify.success(successMessage),
        onError: (err: unknown) => notify.error(err, ErrorHandler(err)),
      },
    );
  };

  const handleUploadComplete = (res?: Array<{ url: string }>) => {
    const uploadedUrl = res?.[0]?.url;
    if (!uploadedUrl) return;

    setLogo(uploadedUrl);
    savePropertyField({ logoUrl: uploadedUrl }, "Logo updated successfully!");
  };

  const handleUploadError = (error: Error) => {
    const isAuthError =
      error.message.includes("User is not authenticated") ||
      error.message.includes("Unauthorized");

    if (isAuthError) {
      notify.error("Session expired. Please log in again.");
      signOut();
    } else {
      notify.error(`Upload failed: ${error.message}`);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    savePropertyField({ brandColor: color }, "Brand color updated!");
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
        <LogoUploader
          logo={logo}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />

        <ColorPicker
          selectedColor={selectedColor}
          onChange={handleColorChange}
          disabled={isPending}
        />
      </div>
    </div>
  );
}

function LogoUploader({
  logo,
  onUploadComplete,
  onUploadError,
}: {
  logo: string | null;
  onUploadComplete: (res?: Array<{ url: string }>) => void;
  onUploadError: (error: Error) => void;
}) {
  return (
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
          onClientUploadComplete={onUploadComplete}
          onUploadError={onUploadError}
          appearance={{
            button:
              "bg-[#37352f] dark:bg-white text-white dark:text-black text-sm px-4 py-2 rounded font-medium focus-within:ring-0 after:bg-emerald-500",
            allowedContent: "text-xs text-[#37352f]/40 dark:text-[#555555]",
          }}
        />
      </div>
    </div>
  );
}

function ColorPicker({
  selectedColor,
  onChange,
  disabled,
}: {
  selectedColor: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  // Local draft so the swatch/hex can update live while dragging,
  // without firing a save on every intermediate value.
  const [draftColor, setDraftColor] = useState(selectedColor);

  useEffect(() => {
    setDraftColor(selectedColor);
  }, [selectedColor]);

  const commitColor = (color: string) => {
    if (color.toLowerCase() !== selectedColor.toLowerCase()) {
      onChange(color);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-[#37352f] dark:text-white uppercase tracking-wider">
        Brand Accent Color
      </label>

      <div className="flex flex-wrap items-center gap-3">
        {PRESET_COLORS.map((preset) => {
          const isSelected =
            selectedColor.toLowerCase() === preset.value.toLowerCase();
          return (
            <button
              key={preset.value}
              type="button"
              disabled={disabled}
              // Preset clicks are discrete, single events — safe to commit directly.
              onClick={() => commitColor(preset.value)}
              title={preset.name}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "ring-2 ring-offset-2 ring-neutral-400 dark:ring-neutral-500 scale-105"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: preset.value }}
            >
              {isSelected && (
                <Check className="w-4 h-4 text-white drop-shadow-sm" />
              )}
            </button>
          );
        })}

        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-neutral-200 dark:border-neutral-800">
          <input
            type="color"
            value={draftColor}
            disabled={disabled}
            // Updates the local preview only — no network call here.
            onChange={(e) => setDraftColor(e.target.value)}
            // Fires once, when the user finishes picking (closes the
            // picker / tabs away).
            onBlur={() => commitColor(draftColor)}
            className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer disabled:opacity-50"
            title="Custom color"
          />
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 uppercase">
            {draftColor}
          </span>
        </div>
      </div>
    </div>
  );
}
