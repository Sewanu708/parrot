"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { CannedResponseDto } from "@parrot/sdk";
import { Globe, User as UserIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const getCannedResponseColumns = (
  onEdit: (response: CannedResponseDto) => void,
  onDelete: (id: string) => void,
): ColumnDef<any, CannedResponseDto>[] => [
  {
    accessorKey: "shortcut",
    header: "Shortcut",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100">
        <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
          /{row.original.shortcut}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "content",
    header: "Response Content",
    cell: ({ row }) => (
      <div className="max-w-md whitespace-pre-wrap break-words text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
        {row.original.content || "—"}
      </div>
    ),
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => {
      const val = row.original.visibility;
      return val === "shared" ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/40">
          <Globe className="w-3 h-3" /> Shared
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
          <UserIcon className="w-3 h-3" /> Personal
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Added Date",
    cell: ({ row }) => {
      const val = row.original.createdAt;
      if (!val) return "—";
      const date = new Date(val);
      return (
        <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          {date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.original)}
          className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          title="Edit response"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(row.original.id)}
          className="h-8 w-8 p-0 text-neutral-500 hover:text-red-500 cursor-pointer"
          title="Delete response"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    ),
  },
];
