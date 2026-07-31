import type { ConversationWithVisitorDto, PropertyDto } from "@parrot/sdk";
import { useState, useRef, useEffect } from "react";

interface InboxSidebarProps {
  conversations: ConversationWithVisitorDto[];
  properties: PropertyDto[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  className?: string;
}

export function InboxSidebar({ conversations, properties, activeChat, onSelectChat, className = "" }: InboxSidebarProps) {
  const [activePropertyFilter, setActivePropertyFilter] = useState<string | "all">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredConversations = activePropertyFilter === "all" 
    ? conversations 
    : conversations.filter(c => c.visitor.propertyId === activePropertyFilter);

  const activePropertyLabel = activePropertyFilter === "all" 
    ? "All Properties" 
    : properties.find(p => p.id === activePropertyFilter)?.name || "Unknown Property";

  return (
    <div className={`shrink-0 border-r border-[#e9e9e7] dark:border-[#2d2d2d] bg-[#fcfcfc] dark:bg-[#1e1e1e] overflow-y-auto flex flex-col ${className}`}>
      {/* List Header / Filter */}
      <div className="px-4 py-3 border-b border-[#e9e9e7] dark:border-[#2d2d2d] flex items-center justify-between relative" ref={filterRef}>
        <span className="text-xs font-semibold text-[#37352f]/70 dark:text-[#9b9b9b] uppercase tracking-wider">
          Open
        </span>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#37352f]/70 dark:text-[#9b9b9b] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer"
        >
          {activePropertyLabel}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isFilterOpen ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {isFilterOpen && (
          <div className="absolute top-full right-4 mt-1 w-48 rounded-md border border-[#e9e9e7] dark:border-[#333333] bg-white dark:bg-[#252525] p-1 shadow-lg z-50">
            <button
              onClick={() => { setActivePropertyFilter("all"); setIsFilterOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs rounded-sm transition-colors cursor-pointer ${
                activePropertyFilter === "all" ? "bg-black/5 dark:bg-white/5 text-[#37352f] dark:text-[#ffffff] font-medium" : "text-[#37352f]/70 dark:text-[#d4d4d4] hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              All Properties
            </button>
            {properties.map(p => (
              <button
                key={p.id}
                onClick={() => { setActivePropertyFilter(p.id); setIsFilterOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs rounded-sm transition-colors cursor-pointer flex items-center gap-2 ${
                  activePropertyFilter === p.id ? "bg-black/5 dark:bg-white/5 text-[#37352f] dark:text-[#ffffff] font-medium" : "text-[#37352f]/70 dark:text-[#d4d4d4] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.brandColor || "#4f46e5" }} />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-sm text-[#37352f]/50 dark:text-[#777777] text-center mt-4">
            No open conversations.
          </div>
        ) : (
          filteredConversations.map(({ conversation, visitor }) => {
            const isUnread = false; // Implement unread logic if available
            const initials =
              visitor.name?.substring(0, 2).toUpperCase() ||
              visitor.email?.substring(0, 2).toUpperCase() ||
              "AN";
            const property = properties.find(p => p.id === visitor.propertyId);

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectChat(conversation.id)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-[#e9e9e7]/50 dark:border-[#2d2d2d]/50 transition-colors cursor-pointer outline-none ${
                  activeChat === conversation.id
                    ? "bg-white dark:bg-[#252525]"
                    : "hover:bg-white/50 dark:hover:bg-[#252525]/50"
                }`}
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-semibold text-[#37352f] dark:text-[#ffffff]">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-sm truncate pr-2 ${
                        isUnread
                          ? "font-bold text-[#37352f] dark:text-[#ffffff]"
                          : "font-medium text-[#37352f]/90 dark:text-[#d4d4d4]"
                      }`}
                    >
                      {visitor.name || visitor.email || "Anonymous Visitor"}
                    </span>
                    <span className="shrink-0 text-[10px] text-[#37352f]/50 dark:text-[#777777]">
                      {new Date(conversation.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] truncate ${
                      isUnread
                        ? "font-medium text-[#37352f]/80 dark:text-[#cccccc]"
                        : "text-[#37352f]/60 dark:text-[#9b9b9b]"
                    }`}
                  >
                    Started {new Date(conversation.createdAt).toLocaleDateString()}
                  </p>
                  {property && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: property.brandColor || "#4f46e5" }} />
                      <span className="text-[9px] font-medium uppercase tracking-wider text-[#37352f]/40 dark:text-[#777777] truncate">
                        {property.name}
                      </span>
                    </div>
                  )}
                </div>
                {isUnread && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
