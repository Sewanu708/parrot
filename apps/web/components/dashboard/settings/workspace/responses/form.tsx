"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Globe, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CannedResponseFormSchema,
  type CannedResponseFormData,
} from "@/lib/schema";

interface CannedResponseFormProps {
  initialValues?: {
    shortcut: string;
    content: string;
    visibility: "shared" | "personal";
  };
  canManageShared?: boolean;
  editingId?: string | null;
  onSubmit?: (data: CannedResponseFormData) => void;
  onCancel?: () => void;
  isPending?: boolean;
}

export function CannedResponseForm({
  initialValues,
  canManageShared = false,
  editingId = null,
  onSubmit = () => {},
  onCancel = () => {},
  isPending = false,
}: CannedResponseFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CannedResponseFormData>({
    resolver: zodResolver(CannedResponseFormSchema),
    defaultValues: initialValues || {
      shortcut: "",
      content: "",
      visibility: "personal",
    },
  });

  const visibility = watch("visibility");

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 mb-4 cursor-pointer"
        >
          &larr; Back to Responses
        </button>
        <h1 className="text-2xl font-bold text-[#37352f] dark:text-[#ffffff]">
          {editingId ? "Edit Response" : "New Canned Response"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#37352f] dark:text-[#ffffff]">
            Shortcut
          </label>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-mono text-lg">/</span>
            <input
              type="text"
              {...register("shortcut")}
              onChange={(e) =>
                setValue(
                  "shortcut",
                  e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase(),
                )
              }
              placeholder="hello"
              className="w-full bg-white dark:bg-[#1e1e1e] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#37352f] dark:text-[#ffffff] focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-transparent font-mono"
              maxLength={50}
            />
          </div>
          {errors.shortcut ? (
            <p className="text-xs text-red-500">{errors.shortcut.message}</p>
          ) : (
            <p className="text-xs text-neutral-500">
              Only letters, numbers, hyphens, and underscores.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#37352f] dark:text-[#ffffff]">
            Response Content
          </label>
          <textarea
            {...register("content")}
            placeholder="Hi there! How can I help you today?"
            className="w-full bg-white dark:bg-[#1e1e1e] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#37352f] dark:text-[#ffffff] focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-transparent min-h-[150px] resize-y"
          />
          {errors.content && (
            <p className="text-xs text-red-500">{errors.content.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-[#37352f] dark:text-[#ffffff]">
            Visibility
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`
                relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none 
                ${
                  visibility === "personal"
                    ? "border-neutral-900 dark:border-white ring-1 ring-neutral-900 dark:ring-white bg-neutral-50 dark:bg-neutral-900/30"
                    : "border-neutral-200 dark:border-[#2d2d2d] bg-white dark:bg-[#191919]"
                }
              `}
            >
              <input
                type="radio"
                value="personal"
                className="sr-only"
                checked={visibility === "personal"}
                onChange={() => setValue("visibility", "personal")}
              />
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <div className="text-sm">
                    <div className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" /> Personal
                    </div>
                    <div className="text-neutral-500 dark:text-neutral-400 mt-1 text-xs">
                      Only you can see and use this response.
                    </div>
                  </div>
                </div>
                {visibility === "personal" && (
                  <Check className="h-4 w-4 text-neutral-900 dark:text-white" />
                )}
              </div>
            </label>

            <label
              className={`
                relative flex rounded-lg border p-4 shadow-sm focus:outline-none 
                ${!canManageShared ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${
                  visibility === "shared"
                    ? "border-neutral-900 dark:border-white ring-1 ring-neutral-900 dark:ring-white bg-neutral-50 dark:bg-neutral-900/30"
                    : "border-neutral-200 dark:border-[#2d2d2d] bg-white dark:bg-[#191919]"
                }
              `}
            >
              <input
                type="radio"
                value="shared"
                className="sr-only"
                disabled={!canManageShared}
                checked={visibility === "shared"}
                onChange={() => canManageShared && setValue("visibility", "shared")}
              />
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <div className="text-sm">
                    <div className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Shared
                    </div>
                    <div className="text-neutral-500 dark:text-neutral-400 mt-1 text-xs">
                      Available to everyone in the workspace.
                      {!canManageShared && " (Requires admin role)"}
                    </div>
                  </div>
                </div>
                {visibility === "shared" && (
                  <Check className="h-4 w-4 text-neutral-900 dark:text-white" />
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-6 border-t border-[#e9e9e7] dark:border-[#2d2d2d]">
          <Button type="submit" disabled={isPending} className="cursor-pointer">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingId ? "Save Changes" : "Create Response"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
