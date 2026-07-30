import type { ConversationWithVisitorDto } from "@parrot/sdk";

interface InboxSidebarProps {
  conversations: ConversationWithVisitorDto[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  className?: string;
}

export function InboxSidebar({ conversations, activeChat, onSelectChat, className = "" }: InboxSidebarProps) {
  return (
    <div className={`shrink-0 border-r border-[#e9e9e7] dark:border-[#2d2d2d] bg-[#fcfcfc] dark:bg-[#1e1e1e] overflow-y-auto flex flex-col ${className}`}>
      {/* List Header / Filter */}
      <div className="px-4 py-3 border-b border-[#e9e9e7] dark:border-[#2d2d2d] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#37352f]/70 dark:text-[#9b9b9b] uppercase tracking-wider">
          Open
        </span>
        <button className="text-[#37352f]/50 dark:text-[#555555] hover:text-[#37352f] dark:hover:text-white transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-sm text-[#37352f]/50 dark:text-[#777777] text-center mt-4">
            No open conversations.
          </div>
        ) : (
          conversations.map(({ conversation, visitor }) => {
            const isUnread = false; // Implement unread logic if available
            const initials =
              visitor.name?.substring(0, 2).toUpperCase() ||
              visitor.email?.substring(0, 2).toUpperCase() ||
              "AN";

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
                    className={`text-xs truncate ${
                      isUnread
                        ? "font-medium text-[#37352f]/80 dark:text-[#cccccc]"
                        : "text-[#37352f]/60 dark:text-[#9b9b9b]"
                    }`}
                  >
                    Started {new Date(conversation.createdAt).toLocaleDateString()}
                  </p>
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
