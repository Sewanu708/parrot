"use client";

import Link from "next/link";
import React from "react";
import { useSidebar } from "./sidebar-provider";
import { Menu } from "lucide-react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  breadcrumbs: Breadcrumb[];
  action?: React.ReactNode;
}

export function Header({ breadcrumbs, action }: HeaderProps) {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between bg-transparent px-8 mt-2">
      
      <div className="flex items-center gap-2">
        {/* Sidebar Expand Toggle */}
        {isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="p-1 rounded-md text-[#37352f]/60 dark:text-[#9b9b9b] hover:bg-black/5 dark:hover:bg-white/10 transition-colors mr-2 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <React.Fragment key={crumb.label}>
              {crumb.href && !isLast ? (
                <Link 
                  href={crumb.href}
                  className="hover:text-[#37352f] dark:hover:text-[#ffffff] transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5 px-1 -mx-1"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={`px-1 -mx-1 ${isLast ? "text-[#37352f] dark:text-[#ffffff] font-medium" : ""}`}>
                  {crumb.label}
                </span>
              )}
              
              {!isLast && (
                <span className="text-[#37352f]/30 dark:text-[#555555]">/</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
      </div>

      {/* Contextual Action */}
      {action && (
        <div className="flex items-center">
          {action}
        </div>
      )}
      
    </header>
  );
}
