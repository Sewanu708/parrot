import type { ConversationWithVisitorDto, MessageDto, CannedResponseDto } from "@parrot/sdk";
import { ChevronLeft } from "lucide-react";
import { ParrotEmptyIcon } from "@/components/icons";
import { UIMessage } from "@/hooks";
import { ChatComposer } from "@/components/parrot-ui/chat-composer";

interface ChatAreaProps {
  activeConversation?: ConversationWithVisitorDto;
  messages: UIMessage[];
  onSend: (text: string) => void;
  isSending: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBack?: () => void;
  isTyping?: boolean;
  cannedResponses: CannedResponseDto[];
}

export function ChatArea({
  activeConversation,
  messages,
  onSend,
  isSending,
  messagesEndRef,
  onBack,
  isTyping,
  cannedResponses,
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
              <ChevronLeft className="w-5 h-5" />
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
      <ChatComposer
        onSend={onSend}
        isSending={isSending}
        cannedResponses={cannedResponses}
      />
    </>
  );
}
