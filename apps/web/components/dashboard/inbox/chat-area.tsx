import type { ConversationWithVisitorDto, MessageDto } from "@parrot/sdk";
import { ParrotEmptyIcon } from "@/components/icons";
import { UIMessage } from "@/hooks";
import TextareaAutosize from "react-textarea-autosize";

interface ChatAreaProps {
  activeConversation?: ConversationWithVisitorDto;
  messages: UIMessage[];
  draft: string;
  setDraft: (val: string) => void;
  onSend: () => void;
  isSending: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBack?: () => void;
  isTyping?: boolean;
}

export function ChatArea({
  activeConversation,
  messages,
  draft,
  setDraft,
  onSend,
  isSending,
  messagesEndRef,
  onBack,
  isTyping,
}: ChatAreaProps) {
  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#37352f]/40 dark:text-[#555555] text-sm">
        <ParrotEmptyIcon className="w-16 h-16 mb-4 opacity-50" />
        <p>Select a conversation to start messaging.</p>
      </div>
    );
  }

  return (
    <>
      {/* Chat Header */}
      <div className="h-13 px-4 md:px-6 border-b border-[#e9e9e7] dark:border-[#2d2d2d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 -ml-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-[#37352f]/60 dark:text-[#9b9b9b] cursor-pointer transition-colors outline-none"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
          )}
          <span className="font-semibold text-sm text-[#37352f] dark:text-[#ffffff]">
            {activeConversation.visitor.name ||
              activeConversation.visitor.email ||
              "Anonymous Visitor"}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded font-medium">
            {activeConversation.conversation.status === "open"
              ? "Active"
              : "Closed"}
          </span>
        </div>
        <button className="text-sm font-medium text-[#37352f]/60 dark:text-[#9b9b9b] hover:text-[#37352f] dark:hover:text-white transition-colors">
          Resolve
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center my-4">
          <span className="text-[10px] font-medium text-[#37352f]/40 dark:text-[#555555] uppercase tracking-widest">
            Beginning of conversation
          </span>
        </div>

        {messages.map((msg: UIMessage) => {
          const isAgent = msg.senderType === "agent";
          const initials = isAgent
            ? "US" // Agent initials placeholder
            : activeConversation.visitor.name?.substring(0, 2).toUpperCase() ||
              activeConversation.visitor.email?.substring(0, 2).toUpperCase() ||
              "AN";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[80%] ${
                isAgent ? "self-end flex-row-reverse" : "self-start"
              } ${msg.isOptimistic ? "opacity-70" : ""}`}
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-semibold text-[#37352f] dark:text-[#ffffff]">
                {initials}
              </div>
              <div
                className={`flex flex-col gap-1 ${
                  isAgent ? "items-end" : "items-start"
                }`}
              >
                <span className="text-xs font-medium text-[#37352f]/60 dark:text-[#9b9b9b] mx-1">
                  {isAgent
                    ? "You"
                    : activeConversation.visitor.name || "Visitor"}
                  ,{" "}
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div
                  className={`px-4 py-2.5 text-sm border ${
                    isAgent
                      ? "bg-[#37352f] dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-sm border-transparent"
                      : "bg-[#f7f7f5] dark:bg-[#252525] text-[#37352f] dark:text-[#ffffff] rounded-2xl rounded-tl-sm border-[#e9e9e7] dark:border-[#333333]"
                  }`}
                >
                  {msg.body}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center self-start gap-2 max-w-[80%] mx-2 mt-2">
            <span className="text-xs font-medium text-[#37352f]/50 dark:text-[#9b9b9b] italic animate-pulse">
              Visitor is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-[#191919]">
        <div className="border border-[#e9e9e7] dark:border-[#333333] rounded-lg p-2 focus-within:border-[#37352f] dark:focus-within:border-white transition-colors shadow-sm bg-white dark:bg-[#202020]">
          <TextareaAutosize
            className="w-full bg-transparent resize-none outline-none text-sm p-2 text-[#37352f] dark:text-[#ffffff] placeholder-[#37352f]/40 dark:placeholder-[#777777]"
            minRows={2}
            maxRows={8}
            placeholder="Reply..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <div className="flex justify-between items-center mt-2 px-2 pb-1">
            <div className="flex items-center gap-2 text-[#37352f]/50 dark:text-[#777777]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </div>
            <button
              onClick={onSend}
              disabled={isSending || !draft.trim()}
              className="h-7 px-4 rounded text-xs font-medium bg-[#37352f] dark:bg-white hover:opacity-90 disabled:opacity-50 text-white dark:text-black transition-opacity cursor-pointer outline-none"
            >
              {isSending ? "..." : "Send"}
            </button>
          </div>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-[#37352f]/40 dark:text-[#555555]">
            Press <kbd className="font-sans font-bold">⌘ Enter</kbd> to send
          </span>
        </div>
      </div>
    </>
  );
}
