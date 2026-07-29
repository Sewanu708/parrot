"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  InboxIcon,
  ContactsIcon,
  AutomationsIcon,
  SettingsIcon,
  SelectorIcon,
  SearchIcon,
  BellIcon,
  ChevronsLeftIcon,
} from "@/components/icons";
import { useSidebar } from "./sidebar-provider";

// In a real app, this would come from a context or API
const workspaces = [
  { id: "1", name: "Parrot Main", plan: "PRO" },
  { id: "2", name: "Parrot Support", plan: "FREE" },
];

const navigation = [
  { name: "Overview", href: "/overview", icon: InboxIcon }, // Re-using InboxIcon temporarily for Overview, though ideally we'd have a specific icon.
  { name: "Inbox", href: "/inbox", icon: InboxIcon },
  { name: "Contacts", href: "/contacts", icon: ContactsIcon },
  {
    name: "Automations",
    href: "/automations",
    icon: AutomationsIcon,
  },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isCollapsed) return null;

  return (
    <div className="flex h-screen w-60 shrink-0 flex-col bg-[#f7f7f5] dark:bg-[#202020] border-r border-[#e9e9e7] dark:border-[#2d2d2d] text-[#37352f] dark:text-[#9b9b9b] font-sans transition-colors duration-200 group/sidebar">
      {/* Top Section */}
      <div className="p-3 space-y-4">
        {/* Logo and Collapse Toggle */}
        <div className="flex items-center justify-between px-2 mb-2 mt-1">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-[#37352f] dark:text-[#ffffff] w-fit"
          >
            parrot.
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </Link>
          <button
            onClick={() => setIsCollapsed(true)}
            className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-[#37352f]/60 dark:text-[#9b9b9b] cursor-pointer"
          >
            <ChevronsLeftIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer outline-none"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="h-5 w-5 rounded-sm bg-black/10 dark:bg-white/10 flex items-center justify-center text-[11px] font-semibold text-[#37352f] dark:text-[#ffffff]">
                {activeWorkspace.name.charAt(0)}
              </div>
              <span className="truncate text-[#37352f] dark:text-[#ffffff]">
                {activeWorkspace.name}
              </span>
            </div>
            <SelectorIcon className="w-3.5 h-3.5 opacity-50" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 w-full rounded-md border border-[#e9e9e7] dark:border-[#333333] bg-white dark:bg-[#252525] p-1 shadow-lg z-50">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    setActiveWorkspace(workspace);
                    setIsDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-2 py-1.5 rounded-sm text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                    activeWorkspace.id === workspace.id
                      ? "bg-black/5 dark:bg-white/5 text-[#37352f] dark:text-[#ffffff]"
                      : "text-[#37352f]/80 dark:text-[#d4d4d4]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-4 rounded-[3px] bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-semibold text-[#37352f] dark:text-[#ffffff]">
                      {workspace.name.charAt(0)}
                    </div>
                    {workspace.name}
                  </div>
                  {workspace.plan === "PRO" && (
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 rounded">
                      Pro
                    </span>
                  )}
                </button>
              ))}
              <div className="my-1 h-px bg-[#e9e9e7] dark:bg-[#333333]" />
              <Link
                href="/create-workspace"
                className="flex w-full items-center gap-2.5 px-2 py-1.5 rounded-sm text-sm text-[#37352f]/60 dark:text-[#9b9b9b] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span className="text-base leading-none font-light">+</span>
                New workspace
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Global Actions */}
      <div className="px-3 space-y-0.5 mb-2 mt-1">
        <button className="flex w-full items-center justify-between gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-[#37352f]/70 dark:text-[#9b9b9b] cursor-pointer outline-none group">
          <div className="flex items-center gap-2.5">
            <SearchIcon className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span>Search</span>
          </div>
          <span className="text-[10px] font-sans border border-black/10 dark:border-white/10 rounded px-1.5 py-0.5 shadow-sm opacity-60">
            ⌘K
          </span>
        </button>
        <button className="flex w-full items-center justify-between gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-[#37352f]/70 dark:text-[#9b9b9b] cursor-pointer outline-none group">
          <div className="flex items-center gap-2.5">
            <BellIcon className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span>Updates</span>
          </div>
          <div className="w-4.5 h-4.5 bg-[#eb5757] rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
            3
          </div>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 mt-2 ml-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-black/5 dark:bg-white/10 text-[#37352f] dark:text-[#ffffff]"
                  : "text-[#37352f]/70 dark:text-[#9b9b9b] hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <item.icon
                className={`w-4.5 h-4.5 ${isActive ? "opacity-100" : "opacity-60"}`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: User Profile & Theme Toggle */}
      <div className="p-3 border-t border-[#e9e9e7] dark:border-[#2d2d2d]">
        <div className="flex items-center justify-between gap-1">
          <button className="flex flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer outline-none overflow-hidden">
            <div className="shrink-0 h-6 w-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-semibold text-[#37352f] dark:text-[#ffffff]">
              US
            </div>
            <span className="font-medium text-[#37352f] dark:text-[#ffffff] text-sm truncate">
              User Account
            </span>
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-[#37352f]/60 dark:text-[#9b9b9b] outline-none cursor-pointer"
              title="Toggle Theme"
            >
              <span className="text-xs font-semibold">
                {theme === "dark" ? "☀" : "☽"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
