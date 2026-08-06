"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
  variant?: "destructive" | "warning";
  requireTypedConfirmation?: boolean;
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  title = "Delete item",
  description = "Are you sure? This action cannot be undone.",
  itemName,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  isPending = false,
  variant = "destructive",
  requireTypedConfirmation = false,
}: ConfirmDeleteModalProps) {
  const [typedValue, setTypedValue] = useState("");

  const needsTyping = requireTypedConfirmation && !!itemName;
  const isConfirmDisabled =
    isPending || (needsTyping && typedValue !== itemName);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setTypedValue("");
    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="w-full !max-w-lg p-7 border-none ring-0 outline-none bg-white dark:bg-[#191919] shadow-2xl rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 font-bold text-sm tracking-tighter text-[#37352f] dark:text-[#ffffff]">
            parrot.
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <AlertDialogHeader className="text-left gap-1 p-0">
          <AlertDialogTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
            {description}
          </AlertDialogDescription>

          {itemName && (
            <div className="mt-2 text-xs font-mono px-2.5 py-1.5 rounded bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 truncate">
              {itemName}
            </div>
          )}
        </AlertDialogHeader>

        {needsTyping && (
          <div className="mt-3 space-y-1">
            <label className="text-[11px] text-neutral-500">
              Type <span className="font-mono font-semibold">{itemName}</span> to confirm
            </label>
            <Input
              autoFocus
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={itemName}
              disabled={isPending}
              className="font-mono text-xs h-8"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}

        <AlertDialogFooter className="mt-4 flex flex-row items-center justify-end gap-2 p-0 bg-transparent border-none">
          <AlertDialogCancel
            disabled={isPending}
            className="cursor-pointer h-8 text-xs px-3"
          >
            {cancelText}
          </AlertDialogCancel>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={isConfirmDisabled}
            onClick={async () => {
              await onConfirm();
            }}
            className="cursor-pointer h-8 text-xs px-3 gap-1.5"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}