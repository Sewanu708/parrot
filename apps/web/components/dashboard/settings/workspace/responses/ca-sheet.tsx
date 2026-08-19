"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit2, Tag, Loader2, AlertCircle, Sparkles, Copy, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import notify from "@/lib/toast";
import { ErrorHandler } from "@/lib/utilities";
import {
  useCustomAttributes,
  useCreateCustomAttribute,
  useUpdateCustomAttribute,
  useDeleteCustomAttribute,
} from "@/hooks/use-settings";
import type { CustomAttributeDto } from "@parrot/sdk";

const attributeSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  label: z.string().min(1, "Display label is required").max(100),
  type: z.enum(["string", "number", "boolean", "date"]),
  defaultValue: z.string().optional(),
  description: z.string().max(255).optional(),
});

type AttributeFormData = z.infer<typeof attributeSchema>;

interface CustomAttributesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVariable?: (variableKey: string) => void;
}

export function CustomAttributesSheet({
  open,
  onOpenChange,
  onSelectVariable,
}: CustomAttributesSheetProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingAttr, setEditingAttr] = useState<CustomAttributeDto | null>(
    null,
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: attributesResponse, isLoading } = useCustomAttributes();
  const attributes = attributesResponse?.data || [];
  const createMutation = useCreateCustomAttribute();
  const updateMutation = useUpdateCustomAttribute();
  const deleteMutation = useDeleteCustomAttribute();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AttributeFormData>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      key: "",
      label: "",
      type: "string",
      defaultValue: "",
      description: "",
    },
  });

  const startCreate = () => {
    reset({
      key: "",
      label: "",
      type: "string",
      defaultValue: "",
      description: "",
    });
    setEditingAttr(null);
    setIsCreating(true);
  };

  const startEdit = (attr: CustomAttributeDto) => {
    reset({
      key: attr.key,
      label: attr.label,
      type: attr.type as "string" | "number" | "boolean" | "date",
      defaultValue: attr.defaultValue || "",
      description: attr.description || "",
    });
    setEditingAttr(attr);
    setIsCreating(true);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingAttr(null);
    reset();
  };

  const onSubmit = (data: AttributeFormData) => {
    if (editingAttr) {
      updateMutation.mutate(
        {
          id: editingAttr.id,
          data: {
            label: data.label,
            type: data.type,
            defaultValue: data.defaultValue || null,
            description: data.description || null,
          },
        },
        {
          onSuccess: () => {
            notify.success("Custom attribute updated");
            cancelForm();
          },
          onError: (err) => {
            const formatted = ErrorHandler(err);
            notify.error(err, formatted);
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          key: data.key.toLowerCase(),
          label: data.label,
          type: data.type,
          defaultValue: data.defaultValue || undefined,
          description: data.description || undefined,
        },
        {
          onSuccess: () => {
            notify.success("Custom attribute created");
            cancelForm();
          },
          onError: (err) => {
            const formatted = ErrorHandler(err);
            notify.error(err, formatted);
          },
        },
      );
    }
  };

  const handleDelete = (id: string, key: string) => {
    if (
      !confirm(
        `Are you sure you want to delete '{{custom.${key}}}'? Templates referencing it will fallback to unresolved.`,
      )
    ) {
      return;
    }

    deleteMutation.mutate(id, {
      onSuccess: () => {
        notify.success("Custom attribute deleted");
      },
      onError: (err) => {
        const formatted = ErrorHandler(err);
        notify.error(err, formatted);
      },
    });
  };

  const handleCopy = (key: string) => {
    const placeholder = `{{custom.${key}}}`;
    navigator.clipboard.writeText(placeholder);
    setCopiedKey(key);
    notify.success(`Copied ${placeholder}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getTypeBadge = (type: string) => {
    return "bg-black/5 text-[#37352f] dark:bg-white/10 dark:text-neutral-300 border border-black/5 dark:border-white/5";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-white dark:bg-[#181818] border-l border-[#e9e9e7] dark:border-[#2d2d2d] text-[#37352f] dark:text-[#ffffff] p-6 overflow-y-auto flex flex-col gap-6"
      >
        <SheetHeader className="space-y-2 text-left">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold text-[#37352f] dark:text-white">
            <Tag className="w-5 h-5 text-[#37352f] dark:text-white" />
            Custom Attributes
          </SheetTitle>
          <SheetDescription className="text-sm text-[#37352f]/70 dark:text-[#9b9b9b] leading-relaxed">
            Define your workspace customer data dictionary. Registered attributes capture rich visitor context (e.g. plan tier, company, renewal date) and power dynamic placeholder interpolation in canned responses and auto-replies.
          </SheetDescription>
        </SheetHeader>


        {isCreating ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 pt-4 border-t border-[#e9e9e7] dark:border-[#2d2d2d]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#37352f] dark:text-white">
                {editingAttr ? `Edit '${editingAttr.key}'` : "New Custom Attribute"}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelForm}
                className="h-7 text-xs cursor-pointer"
              >
                Cancel
              </Button>
            </div>

            {/* Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#37352f] dark:text-white">
                Attribute Key *
              </label>
              <div className="flex items-center">
                <span className="bg-neutral-100 dark:bg-[#252525] border border-r-0 border-[#e9e9e7] dark:border-[#333333] px-2.5 py-2 text-xs font-mono text-neutral-500 rounded-l-md">
                  custom.
                </span>
                <input
                  type="text"
                  {...register("key")}
                  disabled={!!editingAttr}
                  placeholder="plan"
                  onChange={(e) =>
                    setValue(
                      "key",
                      e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase(),
                    )
                  }
                  className="w-full bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#333333] rounded-r-md px-3 py-2 text-xs font-mono text-[#37352f] dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:opacity-50"
                />
              </div>
              {errors.key && (
                <p className="text-[11px] text-red-500">{errors.key.message}</p>
              )}
            </div>

            {/* Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#37352f] dark:text-white">
                Display Label *
              </label>
              <input
                type="text"
                {...register("label")}
                placeholder="Subscription Plan"
                className="w-full bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-3 py-2 text-xs text-[#37352f] dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              {errors.label && (
                <p className="text-[11px] text-red-500">{errors.label.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#37352f] dark:text-white">
                  Data Type
                </label>
                <select
                  {...register("type")}
                  className="w-full bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-2.5 py-2 text-xs text-[#37352f] dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                >
                  <option value="string">String (Text)</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                </select>
              </div>

              {/* Default Value */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#37352f] dark:text-white">
                  Default Fallback
                </label>
                <input
                  type="text"
                  {...register("defaultValue")}
                  placeholder="Free"
                  className="w-full bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-3 py-2 text-xs text-[#37352f] dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#37352f] dark:text-white">
                Description (Optional)
              </label>
              <input
                type="text"
                {...register("description")}
                placeholder="The customer's current active pricing tier"
                className="w-full bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#333333] rounded-md px-3 py-2 text-xs text-[#37352f] dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelForm}
                className="cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="cursor-pointer text-xs"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                )}
                {editingAttr ? "Save Changes" : "Create Attribute"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Registered Attributes ({attributes.length})
              </span>
              <Button
                size="sm"
                onClick={startCreate}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Attribute
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-neutral-100 dark:bg-neutral-800/40 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : attributes.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#e9e9e7] dark:border-[#333333] rounded-xl space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-neutral-400 opacity-60" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  No custom attributes defined yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startCreate}
                  className="text-xs cursor-pointer"
                >
                  Create your first attribute
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[#e9e9e7] dark:divide-[#2d2d2d] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl overflow-hidden">
                {attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="p-3 flex items-start justify-between bg-white dark:bg-[#1e1e1e] hover:bg-neutral-50/50 dark:hover:bg-white/2 transition-colors gap-2"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectVariable) {
                              onSelectVariable(`custom.${attr.key}`);
                              notify.success(`Inserted {{custom.${attr.key}}}`);
                            } else {
                              handleCopy(attr.key);
                            }
                          }}
                          className="group flex items-center gap-1 text-xs font-mono font-semibold bg-neutral-100 dark:bg-[#252525] hover:bg-neutral-200 dark:hover:bg-[#333333] text-neutral-900 dark:text-neutral-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to insert or copy"
                        >
                          <span>{"{{"}custom.{attr.key}{"}}"}</span>
                          {copiedKey === attr.key ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
                          )}
                        </button>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTypeBadge(
                            attr.type,
                          )}`}
                        >
                          {attr.type}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-[#37352f] dark:text-white truncate">
                        {attr.label}
                      </div>

                      {attr.description && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                          {attr.description}
                        </p>
                      )}
                      {attr.defaultValue && (
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                          Fallback: "{attr.defaultValue}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => startEdit(attr)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        title="Edit attribute"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(attr.id, attr.key)}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                        title="Delete attribute"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
