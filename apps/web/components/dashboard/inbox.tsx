"use client";

import { Header } from "@/components/layout/header";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import { ParrotEmptyIcon } from "@/components/icons";

export default function InboxPage() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversationsResponse } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => parrotClient.conversation.getConversations(),
  });
  const conversations = conversationsResponse?.data || [];

  // Automatically select the first chat if none is selected
  useEffect(() => {
    if (!activeChat && conversations.length > 0) {
      setActiveChat(conversations[0].conversation.id);
    }
  }, [conversations, activeChat]);

  // Fetch messages for active chat
  const { data: messagesResponse } = useQuery({
    queryKey: ["messages", activeChat],
    queryFn: () => parrotClient.conversation.getMessages(activeChat!),
    enabled: !!activeChat,
  });
  const messages = messagesResponse?.data || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (body: string) => {
      const conv = conversations.find((c) => c.conversation.id === activeChat);
      if (!conv) throw new Error("Conversation not found");

      return parrotClient.conversation.sendMessage({
        conversationId: activeChat!,
        propertyId: conv.visitor.propertyId,
        body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeChat] });
      setDraft("");
    },
  });

  const handleSend = () => {
    if (draft.trim() && activeChat) {
      sendMessageMutation.mutate(draft.trim());
    }
  };

  const breadcrumbs = [
    { label: "Parrot Main", href: "/overview" },
    { label: "Inbox" },
  ];

  const contextualAction = (
    <button className="h-7 px-3 rounded text-sm font-medium bg-[#37352f] dark:bg-white hover:opacity-90 text-white dark:text-black transition-opacity cursor-pointer outline-none shadow-sm">
      New Message
    </button>
  );

  const activeConversation = conversations.find(
    (c) => c.conversation.id === activeChat
  );

  return (
    <div className="flex flex-col h-full font-sans transition-colors duration-200">
      <Header breadcrumbs={breadcrumbs} action={contextualAction} />

      {/* Inbox Split View Container */}
      <div className="flex flex-1 overflow-hidden border-t border-[#e9e9e7] dark:border-[#2d2d2d] mt-2">
        {/* Left Column: Chat List */}
        <div className="w-[320px] shrink-0 border-r border-[#e9e9e7] dark:border-[#2d2d2d] bg-[#fcfcfc] dark:bg-[#1e1e1e] overflow-y-auto flex flex-col">
          {/* List Header / Filter */}
          <div className="px-4 py-3 border-b border-[#e9e9e7] dark:border-[#2d2d2d] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#37352f]/70 dark:text-[#9b9b9b] uppercase tracking-wider">
              Open
            </span>
            <button className="text-[#37352f]/50 dark:text-[#555555] hover:text-[#37352f] dark:hover:text-white transition-colors">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </button>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-[#37352f]/40 dark:text-[#555555]">
                <ParrotEmptyIcon className="w-12 h-12 mb-3 opacity-50" />
                <span className="text-sm font-medium">No open conversations</span>
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
                    onClick={() => setActiveChat(conversation.id)}
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
                          {new Date(conversation.updatedAt).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
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

        {/* Right Column: Active Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#191919]">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#37352f]/40 dark:text-[#555555] text-sm">
              <ParrotEmptyIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>Select a conversation to start messaging.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-13 px-6 border-b border-[#e9e9e7] dark:border-[#2d2d2d] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
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

                {messages.map((msg) => {
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
                      }`}
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
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-[#191919]">
                <div className="border border-[#e9e9e7] dark:border-[#333333] rounded-lg p-2 focus-within:border-[#37352f] dark:focus-within:border-white transition-colors shadow-sm bg-white dark:bg-[#202020]">
                  <textarea
                    className="w-full bg-transparent resize-none outline-none text-sm p-2 text-[#37352f] dark:text-[#ffffff] placeholder-[#37352f]/40 dark:placeholder-[#777777]"
                    rows={2}
                    placeholder="Reply..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSend();
                      }
                    }}
                  />
                  <div className="flex justify-between items-center mt-2 px-2 pb-1">
                    <div className="flex items-center gap-2 text-[#37352f]/50 dark:text-[#777777]">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={sendMessageMutation.isPending || !draft.trim()}
                      className="h-7 px-4 rounded text-xs font-medium bg-[#37352f] dark:bg-white hover:opacity-90 disabled:opacity-50 text-white dark:text-black transition-opacity cursor-pointer outline-none"
                    >
                      {sendMessageMutation.isPending ? "..." : "Send"}
                    </button>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <span className="text-[10px] text-[#37352f]/40 dark:text-[#555555]">
                    Press <kbd className="font-sans font-bold">⌘ Enter</kbd> to
                    send
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
