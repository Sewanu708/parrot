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
  { name: "Overview", href: "/dashboard", icon: InboxIcon }, // Re-using InboxIcon temporarily for Overview, though ideally we'd have a specific icon.
  { name: "Inbox", href: "/dashboard/inbox", icon: InboxIcon },
  { name: "Contacts", href: "/dashboard/contacts", icon: ContactsIcon },
  {
    name: "Automations",
    href: "/dashboard/automations",
    icon: AutomationsIcon,
  },
  { name: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTempExpanded, setIsTempExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visuallyCollapsed = isCollapsed && !isTempExpanded;

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

    // Auto-collapse on small screens
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", checkScreenSize);
    };
  }, [setIsCollapsed]);

  return (
    <div className={`relative h-screen shrink-0 transition-[width] duration-300 ${isCollapsed ? "w-14" : "w-60"} z-50`}>
      <div 
        onMouseEnter={() => {
          if (isCollapsed) setIsTempExpanded(true);
        }}
        onMouseLeave={() => {
          if (isCollapsed) {
            setIsTempExpanded(false);
            setIsDropdownOpen(false);
          }
        }}
        className={`absolute left-0 top-0 flex h-screen flex-col bg-[#f7f7f5] dark:bg-[#202020] border-r border-[#e9e9e7] dark:border-[#2d2d2d] text-[#37352f] dark:text-[#9b9b9b] font-sans transition-all duration-300 group/sidebar overflow-hidden ${
          visuallyCollapsed ? "w-14 items-center" : "w-60"
        } ${isCollapsed && isTempExpanded ? "shadow-[4px_0_24px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)]" : ""}`}
      >
        {/* Top Section */}
        <div className={`p-3 space-y-4 w-full flex flex-col ${visuallyCollapsed ? "items-center px-2" : ""}`}>
          {/* Logo and Collapse Toggle */}
          <div className={`flex items-center ${visuallyCollapsed ? "justify-center w-full" : "justify-between px-2"} mb-2 mt-1`}>
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg text-[#37352f] dark:text-[#ffffff] w-fit"
            >
              {visuallyCollapsed ? "p." : "parrot."}
              {!visuallyCollapsed && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
            </Link>
            {!visuallyCollapsed && (
              <button
                onClick={() => {
                  setIsCollapsed(!isCollapsed);
                  setIsTempExpanded(false);
                }}
                className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-[#37352f]/60 dark:text-[#9b9b9b] cursor-pointer"
                title={isCollapsed ? "Pin Sidebar" : "Collapse Sidebar"}
              >
                <ChevronsLeftIcon className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>

          {/* Workspace Switcher */}
          {!visuallyCollapsed ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer outline-none"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="h-5 w-5 rounded-sm bg-black/10 dark:bg-white/10 flex items-center justify-center text-[11px] font-semibold text-[#37352f] dark:text-[#ffffff] shrink-0">
                    {activeWorkspace.name.charAt(0)}
                  </div>
                  <span className="truncate text-[#37352f] dark:text-[#ffffff]">
                    {activeWorkspace.name}
                  </span>
                </div>
                <SelectorIcon className="w-3.5 h-3.5 opacity-50 shrink-0" />
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
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="h-4 w-4 rounded-[3px] bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-semibold text-[#37352f] dark:text-[#ffffff] shrink-0">
                          {workspace.name.charAt(0)}
                        </div>
                        <span className="truncate">{workspace.name}</span>
                      </div>
                      {workspace.plan === "PRO" && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 rounded shrink-0">
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
                    <span className="text-base leading-none font-light shrink-0">+</span>
                    <span className="truncate">New workspace</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="flex items-center justify-center rounded-md p-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer outline-none mt-2" 
              title={activeWorkspace.name}
              onClick={() => setIsTempExpanded(true)}
            >
              <div className="h-5 w-5 rounded-sm bg-black/10 dark:bg-white/10 flex items-center justify-center text-[11px] font-semibold text-[#37352f] dark:text-[#ffffff]">
                {activeWorkspace.name.charAt(0)}
              </div>
            </button>
          )}
        </div>

        {/* Global Actions */}
        <div className={`px-3 space-y-0.5 mb-2 mt-1 w-full flex flex-col ${visuallyCollapsed ? "items-center" : ""}`}>
          <button className={`flex w-full items-center ${visuallyCollapsed ? "justify-center" : "justify-between"} gap-2.5 rounded-md ${visuallyCollapsed ? "p-2" : "px-2 py-1.5"} text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-[#37352f]/70 dark:text-[#9b9b9b] cursor-pointer outline-none group`} title={visuallyCollapsed ? "Search" : undefined}>
            <div className={`flex items-center ${visuallyCollapsed ? "justify-center" : "gap-2.5"}`}>
              <SearchIcon className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
              {!visuallyCollapsed && <span className="truncate">Search</span>}
            </div>
            {!visuallyCollapsed && (
              <span className="text-[10px] font-sans border border-black/10 dark:border-white/10 rounded px-1.5 py-0.5 shadow-sm opacity-60 shrink-0">
                ⌘K
              </span>
            )}
          </button>
          <button className={`flex w-full items-center ${visuallyCollapsed ? "justify-center" : "justify-between"} gap-2.5 rounded-md ${visuallyCollapsed ? "p-2" : "px-2 py-1.5"} text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-[#37352f]/70 dark:text-[#9b9b9b] cursor-pointer outline-none group relative`} title={visuallyCollapsed ? "Updates" : undefined}>
            <div className={`flex items-center ${visuallyCollapsed ? "justify-center" : "gap-2.5"}`}>
              <BellIcon className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
              {!visuallyCollapsed && <span className="truncate">Updates</span>}
            </div>
            {!visuallyCollapsed ? (
              <div className="w-4.5 h-4.5 bg-[#eb5757] rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0">
                3
              </div>
            ) : (
              <div className="absolute top-1 right-1 w-2 h-2 bg-[#eb5757] rounded-full border-2 border-[#f7f7f5] dark:border-[#202020]" />
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className={`flex-1 space-y-0.5 px-3 mt-2 ${visuallyCollapsed ? "flex flex-col items-center" : "ml-2"}`}>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center ${visuallyCollapsed ? "justify-center w-full p-2" : "gap-2.5 px-2 py-1.5"} rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-black/5 dark:bg-white/10 text-[#37352f] dark:text-[#ffffff]"
                    : "text-[#37352f]/70 dark:text-[#9b9b9b] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                title={visuallyCollapsed ? item.name : undefined}
                onClick={() => {
                  if (isCollapsed) setIsTempExpanded(false);
                }}
              >
                <item.icon
                  className={`w-4.5 h-4.5 shrink-0 ${isActive ? "opacity-100" : "opacity-60"}`}
                />
                {!visuallyCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: User Profile & Theme Toggle */}
        <div className={`p-3 border-t border-[#e9e9e7] dark:border-[#2d2d2d] flex flex-col ${visuallyCollapsed ? "items-center" : ""}`}>
          <div className={`flex items-center ${visuallyCollapsed ? "justify-center flex-col gap-3" : "justify-between gap-1"} w-full`}>
            <button className={`flex ${visuallyCollapsed ? "justify-center" : "flex-1"} items-center gap-2.5 rounded-md ${visuallyCollapsed ? "p-1" : "px-2 py-1.5"} transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer outline-none overflow-hidden`} title={visuallyCollapsed ? "User Account" : undefined}>
              <div className="shrink-0 h-6 w-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-semibold text-[#37352f] dark:text-[#ffffff]">
                US
              </div>
              {!visuallyCollapsed && (
                <span className="font-medium text-[#37352f] dark:text-[#ffffff] text-sm truncate">
                  User Account
                </span>
              )}
            </button>

            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`shrink-0 h-7 w-7 rounded-md flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-[#37352f]/60 dark:text-[#9b9b9b] outline-none cursor-pointer`}
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
    </div>
  );
}
