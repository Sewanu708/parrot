"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";

const navItems = [
  { name: "Workspace", href: ROUTES.DASHBOARD.SETTINGS.ROOT },
  { name: "Properties", href: ROUTES.DASHBOARD.SETTINGS.CHANNELS },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="w-60 border-r border-[#e9e9e7] dark:border-[#2d2d2d] bg-[#fcfcfc] dark:bg-[#1e1e1e] p-4 flex flex-col gap-1 shrink-0 h-full overflow-y-auto">
      <h2 className="text-xs font-semibold text-[#37352f]/70 dark:text-[#9b9b9b] uppercase tracking-wider mb-2 px-2 mt-2">
        Settings
      </h2>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
  );
}
