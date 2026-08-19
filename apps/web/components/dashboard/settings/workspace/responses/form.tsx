import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Globe, User as UserIcon, Loader2, Tag, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CannedResponseFormSchema,
  type CannedResponseFormData,
} from "@/lib/schema";
import { useCustomAttributes } from "@/hooks/use-settings";

interface CannedResponseFormProps {
  initialValues?: {
    shortcut: string;
    content: string;
    visibility: "shared" | "personal";
  };
  editingId?: string | null;
  onSubmit?: (data: CannedResponseFormData) => void;
  onCancel?: () => void;
  isPending?: boolean;
  onOpenAttributesSheet?: () => void;
}

export function CannedResponseForm({
  initialValues,
  editingId = null,
  onSubmit = () => {},
  onCancel = () => {},
  isPending = false,
  onOpenAttributesSheet = () => {},
}: CannedResponseFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { data: customAttributesResponse } = useCustomAttributes();
  const customAttributes = customAttributesResponse?.data || [];

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
  const content = watch("content") || "";

  const insertVariable = (variableKey: string) => {
    const placeholder = `{{${variableKey}}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setValue("content", content + placeholder);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = `${before}${placeholder}${after}`;

    setValue("content", newContent, { shouldValidate: true });

    // Restore focus and cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const nextPos = start + placeholder.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const { ref: formTextareaRef, ...contentRegister } = register("content");

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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#37352f] dark:text-[#ffffff]">
              Response Content
            </label>
            <span className="text-xs text-neutral-400">
              Click any variable below to insert
            </span>
          </div>

          {/* Dynamic Variable Inserter */}
          <div className="bg-[#f7f7f5] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-neutral-500" />
                Available Placeholders
              </span>
              <button
                type="button"
                onClick={onOpenAttributesSheet}
                className="text-[11px] text-[#37352f] dark:text-neutral-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3 h-3" />
                Add Custom Attribute
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {/* Built-in Visitor Variables */}
              <button
                type="button"
                onClick={() => insertVariable("visitor.name")}
                className="text-xs font-mono bg-white dark:bg-[#181818] hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] border border-[#e9e9e7] dark:border-[#333333] px-2 py-1 rounded text-[#37352f] dark:text-white cursor-pointer transition-colors"
                title="Customer's full name"
              >
                {"{{"}visitor.name{"}}"}
              </button>
              <button
                type="button"
                onClick={() => insertVariable("visitor.email")}
                className="text-xs font-mono bg-white dark:bg-[#181818] hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] border border-[#e9e9e7] dark:border-[#333333] px-2 py-1 rounded text-[#37352f] dark:text-white cursor-pointer transition-colors"
                title="Customer's email address"
              >
                {"{{"}visitor.email{"}}"}
              </button>

              {/* Custom Attributes */}
              {customAttributes.map((attr) => (
                <button
                  key={attr.id}
                  type="button"
                  onClick={() => insertVariable(`custom.${attr.key}`)}
                  className="text-xs font-mono bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 px-2 py-1 rounded text-[#37352f] dark:text-white cursor-pointer transition-colors"
                  title={`${attr.label}${attr.defaultValue ? ` (default: "${attr.defaultValue}")` : ""}`}
                >
                  {"{{"}custom.{attr.key}{"}}"}
                </button>
              ))}

              {/* Agent & Workspace Variables */}
              <button
                type="button"
                onClick={() => insertVariable("agent.firstName")}
                className="text-xs font-mono bg-white dark:bg-[#181818] hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] border border-[#e9e9e7] dark:border-[#333333] px-2 py-1 rounded text-[#37352f] dark:text-white cursor-pointer transition-colors"
                title="Your first name"
              >
                {"{{"}agent.firstName{"}}"}
              </button>
              <button
                type="button"
                onClick={() => insertVariable("tenant.name")}
                className="text-xs font-mono bg-white dark:bg-[#181818] hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] border border-[#e9e9e7] dark:border-[#333333] px-2 py-1 rounded text-[#37352f] dark:text-white cursor-pointer transition-colors"
                title="Workspace name"
              >
                {"{{"}tenant.name{"}}"}
              </button>
            </div>
          </div>

          <textarea
            {...contentRegister}
            ref={(e) => {
              formTextareaRef(e);
              textareaRef.current = e;
            }}
            placeholder="Hi {{visitor.name}}, thank you for reaching out to {{tenant.name}}!"
            className="w-full bg-white dark:bg-[#1e1e1e] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#37352f] dark:text-[#ffffff] focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-transparent min-h-[150px] resize-y font-sans"
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
                relative flex rounded-lg border p-4 shadow-sm focus:outline-none cursor-pointer
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
                checked={visibility === "shared"}
                onChange={() => setValue("visibility", "shared")}
              />
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <div className="text-sm">
                    <div className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Shared
                    </div>
                    <div className="text-neutral-500 dark:text-neutral-400 mt-1 text-xs">
                      Available to everyone in the workspace.
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
