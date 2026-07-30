"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import notify from "@/lib/toast";
import { PropertyDto, UpdatePropertyDto } from "@parrot/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeneralSettingsFormData, GeneralSettingsSchema } from "@/lib/schema";


export function GeneralSettings({ property }: { property: PropertyDto }) {
  const queryClient = useQueryClient();
  
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

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePropertyDto) => parrotClient.tenant.updateProperty(property.id, data),
    onSuccess: (_, variables) => {
      notify.success("Property details updated");
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      reset(variables);
    },
    onError: (err: any) => {
      notify.error(err.message || "Failed to update property");
    },
  });

  const onSubmit = (data: GeneralSettingsFormData) => {
    updateMutation.mutate({
      name: data.name,
      domain: data.domain || undefined,
      supportEmail: data.supportEmail || undefined,
    });
  };

  return (
    <div className="bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl p-6">
      <h2 className="text-lg font-semibold text-[#37352f] dark:text-[#ffffff] mb-2">
        General Details
      </h2>
      <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b] mb-6">
        Update the core information for this property.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#37352f] dark:text-white uppercase tracking-wider">
              Property Name
            </label>
            <Input 
              {...register("name")}
              placeholder="e.g. Marketing Site" 
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#37352f] dark:text-white uppercase tracking-wider">
              Domain (Optional)
            </label>
            <Input 
              {...register("domain")}
              placeholder="e.g. example.com" 
            />
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
            <p className="text-xs text-red-500">{errors.supportEmail.message}</p>
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
  );
}
