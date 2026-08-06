"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import notify from "@/lib/toast";
import { PropertyDto } from "@parrot/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeneralSettingsFormData, GeneralSettingsSchema } from "@/lib/schema";
import { useUpdateProperty } from "@/hooks/use-settings";
import { ErrorHandler } from "@/lib/utilities";

export function GeneralSettings({ property }: { property: PropertyDto }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: {
      name: property.name,
      domain: property.domain || "",
      supportEmail: property.supportEmail || "",
    },
  });

  const updateMutation = useUpdateProperty();

  const onSubmit = (data: GeneralSettingsFormData) => {
    updateMutation.mutate(
      {
        propertyId: property.id,
        data: {
          name: data.name,
          domain: data.domain || undefined,
          supportEmail: data.supportEmail || undefined,
        },
      },
      {
        onSuccess: () => {
          notify.success("Property details updated");
          reset(data);
        },
        onError: (err: unknown) => {
          const formattedError = ErrorHandler(err);
          notify.error(err, formattedError);
        },
      },
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 py-8 border-b border-[#e9e9e7] dark:border-[#2d2d2d] last:border-0">
      <div className="md:col-span-1 space-y-1">
        <h2 className="text-base font-semibold text-[#37352f] dark:text-[#ffffff]">
          General Details
        </h2>
        <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
          Update the core information for this property.
        </p>
      </div>
      <div className="md:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#37352f] dark:text-white uppercase tracking-wider">
                Property Name
              </label>
              <Input {...register("name")} placeholder="e.g. Marketing Site" />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#37352f] dark:text-white uppercase tracking-wider">
                Domain (Optional)
              </label>
              <Input {...register("domain")} placeholder="e.g. example.com" />
              {errors.domain && (
                <p className="text-xs text-red-500">{errors.domain.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#37352f] dark:text-white uppercase tracking-wider">
              Support Email (Optional)
            </label>
            <Input
              {...register("supportEmail")}
              placeholder="e.g. help@example.com"
            />
            {errors.supportEmail && (
              <p className="text-xs text-red-500">
                {errors.supportEmail.message}
              </p>
            )}
            <p className="text-xs text-[#37352f]/60 dark:text-[#9b9b9b]">
              Visitors can email this address if they are offline.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
