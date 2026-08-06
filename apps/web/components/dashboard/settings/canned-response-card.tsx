"use client";

import type { CannedResponseDto } from "@parrot/sdk";
import { Edit2, Trash2, Globe, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CannedResponseCardProps {
  response: CannedResponseDto;
  onEdit: (response: CannedResponseDto) => void;
  onDelete: (id: string) => void;
}

export function CannedResponseCard({
  response,
  onEdit,
  onDelete,
}: CannedResponseCardProps) {
  return (
    <div className="group bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200 ring-1 ring-inset ring-neutral-300/50 dark:ring-neutral-700/50 font-mono">
              /{response.shortcut}
            </span>
            {response.visibility === "shared" ? (
              <span
                className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
                title="Shared with workspace"
              >
                <Globe className="w-3 h-3" /> Shared
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
                title="Only visible to you"
              >
                <UserIcon className="w-3 h-3" /> Personal
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2 whitespace-pre-wrap">
            {response.content}
          </p>
          <div className="mt-4 text-xs text-neutral-400">
            Added{" "}
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(response.createdAt))}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 cursor-pointer"
            onClick={() => onEdit(response)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 cursor-pointer"
            onClick={() => onDelete(response.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
