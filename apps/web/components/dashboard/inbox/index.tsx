"use client";

import { Header } from "@/components/layout/header";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import { useSession } from "next-auth/react";
import { InboxSidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useSendMessage } from "@/hooks";
import notify from "@/lib/toast";
import { isParrotErrorInstance } from "@/lib/utilities";

export default function InboxPage() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEmitRef = useRef<number>(0);
  const { data: session } = useSession();
  const activeTenantId = session?.user?.activeTenantId;

  // Fetch properties for the unified inbox
  const { data: propertiesResponse } = useQuery({
    queryKey: ["properties", activeTenantId],
    queryFn: () => parrotClient.tenant.getProperties(activeTenantId!),
    enabled: !!activeTenantId,
  });
  const properties = propertiesResponse?.data || [];

  // Fetch conversations
  const { data: conversationsResponse, isLoading: isLoadingConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => parrotClient.conversation.getConversations(),
  });
  const conversations = conversationsResponse?.data || [];

  // Automatically select the first chat if none is selected
  useEffect(() => {
    // Only auto-select on desktop, so mobile users see the conversation list first
    if (!activeChat && conversations.length > 0 && window.innerWidth >= 768) {
      setActiveChat(conversations[0].conversation.id);
    }
  }, [conversations, activeChat]);

  // Fetch messages for active chat
  const { data: messagesResponse, error: messagesError } = useQuery({
    queryKey: ["messages", activeChat],
    queryFn: () => parrotClient.conversation.getMessages(activeChat!),
    enabled: !!activeChat,
  });
  const messages = messagesResponse?.data || [];

  useEffect(() => {
    if (messagesError) {
      if (isParrotErrorInstance(messagesError) && messagesError.publicCode === "SL13") {
        notify.error("Conversation not found. Returning to inbox.");
        setActiveChat(null);
      }
    }
  }, [messagesError]);

  // Listen for typing events
  useEffect(() => {
    const handleTyping = (data: { conversationId: string; senderType: string }) => {
      if (data.conversationId === activeChat && data.senderType === "visitor") {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };
    
    // Clear typing state when switching chats
    setIsTyping(false);

    parrotClient.ws.on("typing:start", handleTyping);
    return () => parrotClient.ws.off("typing:start", handleTyping);
  }, [activeChat]);

  const handleSend = () => {
    if (draft.trim() && activeChat) {
      sendMessageMutation.mutate(draft.trim());
      setDraft("");
      lastTypingEmitRef.current = 0;
    }
  };

  const handleDraftChange = (newDraft: string) => {
    setDraft(newDraft);
    
    if (!lastTypingEmitRef.current || Date.now() - lastTypingEmitRef.current > 2000) {
      if (newDraft.trim() && activeConversation?.visitor?.id) {
        parrotClient.ws.emit("typing:start", {
          conversationId: activeChat,
          targetVisitorId: activeConversation.visitor.clientVisitorId,
          senderType: "agent"
        });
        lastTypingEmitRef.current = Date.now();
      }
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation with Optimistic UI
  const sendMessageMutation = useSendMessage(activeChat, conversations, () => setDraft(""));

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
        <InboxSidebar 
          conversations={conversations} 
          properties={properties}
          activeChat={activeChat} 
          onSelectChat={setActiveChat} 
          isLoading={isLoadingConversations}
          className={`${activeChat ? "hidden md:flex" : "flex w-full"} md:w-[320px]`}
        />

        {/* Right Column: Active Chat Area */}
        <div className={`${!activeChat ? "hidden md:flex" : "flex w-full"} flex-1 flex flex-col bg-white dark:bg-[#191919]`}>
          <ChatArea 
            activeConversation={activeConversation}
            messages={messages}
            draft={draft}
            setDraft={handleDraftChange}
            onSend={handleSend}
            isSending={sendMessageMutation.isPending}
            messagesEndRef={messagesEndRef}
            onBack={() => setActiveChat(null)}
            isTyping={isTyping}
          />
        </div>
      </div>
    </div>
  );
}
