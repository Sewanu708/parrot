"use client";

import { useEffect, useRef } from "react";
import type { CannedResponseDto } from "@parrot/sdk";

interface SlashCommandMenuProps {
  items: CannedResponseDto[];
  selectedIndex: number;
  onSelect: (item: CannedResponseDto) => void;
}

export function SlashCommandMenu({
  items,
  selectedIndex,
  onSelect,
}: SlashCommandMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = containerRef.current?.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (items.length === 0) {
    return (
      <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-[#e9e9e7] dark:border-[#2d2d2d] bg-white dark:bg-[#202020] shadow-lg p-3">
        <p className="text-xs text-neutral-400">No matching responses</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 w-72 max-h-52 overflow-y-auto rounded-lg border border-[#e9e9e7] dark:border-[#2d2d2d] bg-white dark:bg-[#202020] shadow-lg py-1"
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          
          onClick={() => onSelect(item)}
          className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 cursor-pointer transition-colors ${
            index === selectedIndex
              ? "bg-neutral-100 dark:bg-[#2a2a2a]"
              : "hover:bg-neutral-50 dark:hover:bg-[#252525]"
          }`}
        >
          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            /{item.shortcut}
          </span>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
            {item.content}
          </span>
        </button>
      ))}
    </div>
  );
}
