"use client";

import { useState, useEffect, useRef } from "react";
import { parrotClient } from "../../lib/parrot";
import { authStorage } from "../../lib/auth";
import { env } from "../../lib/env";
import type { MessageDto } from "@parrot/sdk";

interface ConversationItem {
  id: string;
  visitorName: string;
  visitorId: string;
  lastMessage: string;
  updatedAt: string;
  status: "open" | "assigned" | "closed";
  unreadCount?: number;
}

export default function DashboardPage() {

  const [activeTab, setActiveTab] = useState<"inbox" | "tickets" | "settings">("inbox");
  const [conversations, setConversations] = useState<ConversationItem[]>();

  const [activeConvId, setActiveConvId] = useState<string>("5f9cb3e9-47ef-458e-b8be-dbb9440820ec");
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [replyText, setReplyText] = useState("");
  const [tenantId, setTenantId] = useState<string>("08ce1e6d-da79-45f6-b63a-c8c3157082a0");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize auth session & active tenant ID from storage
  useEffect(() => {
    authStorage.initClientFromStorage();
    const storedTenantId = authStorage.getTenantId();
    if (storedTenantId) {
      setTenantId(storedTenantId);
    }
  }, []);


  // Scroll message feed to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Connect WebSocket for real-time incoming visitor messages
  useEffect(() => {
    const wsHost = env.NEXT_PUBLIC_API_URL.replace(/^http/, "ws");
    const wsUrl = `${wsHost}/ws?type=agent&tenantId=${tenantId}`;
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "message:new" && payload.data) {
            const newMsg = payload.data as MessageDto;

            // Update messages list if viewing the relevant conversation
            setMessages((prev) => [...prev, newMsg]);

            // Update conversation list item last message
            setConversations((prev) =>
              prev?.map((c) =>
                c.id === newMsg.conversationId
                  ? { ...c, lastMessage: newMsg.body || "", updatedAt: newMsg.createdAt }
                  : c
              )
            );
          }
        } catch (e) {
          console.error("Failed to parse WS message:", e);
        }
      };
    } catch (e) {
      console.error("WS Connection failed:", e);
    }

    return () => {
      if (socket) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        } else if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => socket.close();
        }
      }
    };
  }, [tenantId]);

  // Send agent reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !activeConvId) return;

    const text = replyText;
    setReplyText("");

    // Optimistic local add
    const tempMsg: MessageDto = {
      id: "temp-" + Date.now(),
      conversationId: activeConvId,
      senderType: "agent",
      agentId: "agent-1",
      visitorId: null,
      messageType: "text",
      body: text,
      status: "sent",
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      await parrotClient.conversation.sendMessage({
        conversationId: activeConvId,
        propertyId: "eaaeef31-c9f8-4960-ae65-ffb4e1aa1003",
        body: text,
      });
    } catch (err) {
      console.error("Failed to send agent reply:", err);
    }
  };

  const activeConv = conversations?.find((c) => c.id === activeConvId);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* 1. Left Navigation Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
        <div>
          {/* Tenant Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
              🦜
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-tight text-slate-100">Parrot Support</h2>
              <span className="text-xs text-indigo-400 font-medium">Acme Workspace</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "inbox"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span>💬</span>
                <span>Inbox</span>
              </div>
              <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full font-semibold">
                {conversations?.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("tickets")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "tickets"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span>🎟️</span>
              <span>Tickets</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "settings"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span>⚙️</span>
              <span>Widget Settings</span>
            </button>
          </nav>
        </div>

        {/* Agent Profile Footer */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
            AG
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">Agent Support</p>
            <p className="text-[10px] text-emerald-400 font-medium">● Online</p>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      {activeTab === "inbox" && (
        <div className="flex-1 flex overflow-hidden">
          {/* 2. Middle Panel: Conversation Inbox List */}
          <div className="w-80 bg-slate-900/50 border-r border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800">
              <h1 className="text-base font-semibold text-slate-100 mb-3">Conversations</h1>
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
              {conversations?.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`p-4 cursor-pointer transition ${
                    activeConvId === c.id
                      ? "bg-indigo-600/10 border-l-2 border-indigo-500"
                      : "hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-slate-200">{c.visitorName}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-snug">{c.lastMessage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Center Panel: Active Chat Thread */}
          <div className="flex-1 flex flex-col bg-slate-950">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{activeConv?.visitorName}</h3>
                <span className="text-xs text-slate-400">ID: {activeConv?.visitorId}</span>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                ● Open Chat
              </span>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.senderType === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.senderType === "agent"
                        ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20"
                        : "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none"
                    }`}
                  >
                    <p>{m.body}</p>
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        m.senderType === "agent" ? "text-indigo-200" : "text-slate-400"
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder="Type your reply to the customer..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendReply}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold text-sm transition shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  Send ➔
                </button>
              </div>
            </div>
          </div>

          {/* 4. Right Panel: Visitor Details & Context */}
          <div className="w-72 bg-slate-900/40 border-l border-slate-800 p-5 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Visitor Info
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Client ID</span>
                  <span className="text-slate-200 font-mono">{activeConv?.visitorId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Channel</span>
                  <span className="text-indigo-400 font-medium">Live Chat Widget</span>
                </div>
                <div>
                  <span className="text-slate-500 block">First Seen</span>
                  <span className="text-slate-300">Just now</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Active Tenant
              </h4>
              <span className="text-xs font-mono bg-slate-900 p-2 rounded block border border-slate-800 text-slate-300">
                {tenantId}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="flex-1 p-10 overflow-y-auto">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Widget Embed Code</h1>
          <p className="text-sm text-slate-400 mb-6">
            Copy and paste this script tag into the <code>&lt;head&gt;</code> of your website to enable live chat.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs text-indigo-300 overflow-x-auto">
            {`<script
  src="http://localhost:5173/dist/widget.js"
  data-property-id="eaaeef31-c9f8-4960-ae65-ffb4e1aa1003"
  data-api-host="http://localhost:8080"
  defer>
</script>`}
          </div>
        </div>
      )}
    </div>
  );
}
