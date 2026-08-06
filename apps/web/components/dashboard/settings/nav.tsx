"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SETTINGS_NAV_ITEMS } from "@/lib/constants";

export function SettingsNav() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "workspace";

  return (
    <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-[#e9e9e7] dark:border-[#2d2d2d] bg-[#fcfcfc] dark:bg-[#1e1e1e] p-2 md:p-4 flex md:flex-col gap-1 shrink-0 md:h-full overflow-x-auto md:overflow-y-auto no-scrollbar">
      <h2 className="hidden md:block text-xs font-semibold text-[#37352f]/70 dark:text-[#9b9b9b] uppercase tracking-wider mb-2 px-2 mt-2">
        Settings
      </h2>
      <div className="flex md:flex-col gap-1">
        {SETTINGS_NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.tab;
          return (
            <Link
              key={item.name}
              href={`?tab=${item.tab}`}
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-black/5 dark:bg-white/10 text-[#37352f] dark:text-[#ffffff]"
                  : "text-[#37352f]/70 dark:text-[#9b9b9b] hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
