"use client";

import { ParrotClient } from "@parrot/sdk";
import type { ConversationWithVisitorDto, MessageDto } from "@parrot/sdk";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useRef } from "react";
import { parrotClient } from "./parrot";
import queryClient from "./query-client";

interface WsContextType {
  ws: ParrotClient["ws"] | null;
}

const WsContext = createContext<WsContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const timeOutRef = useRef<null | NodeJS.Timeout>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.activeTenantId) {
      console.log("Authenticated, ensuring WebSocket and SDK are connected.");
      parrotClient.setToken(session.user.sessionToken);
      parrotClient.setTenantId(session.user.activeTenantId || undefined);
      parrotClient.ws.connect({ type: "agent" });

      parrotClient.ws.on("message:new", (data) => {
        console.log("WebSocket message received:", data);

        // 1. Inject the new message directly into the active chat's cache
        queryClient.setQueryData(
          ["messages", data?.conversationId],
          (oldData: { data: MessageDto[] } | undefined) => {
            if (!oldData?.data) return oldData; // Not fetched yet

            // Prevent duplicates
            const exists = oldData.data.some(
              (msg: MessageDto) => msg.id === data.id,
            );
            if (exists) return oldData;

            return {
              ...oldData,
              data: [...oldData.data, data], // Append new message
            };
          },
        );

        // 2. Bump the conversation to the top of the sidebar cache
        queryClient.setQueryData(
          ["conversations"],
          (oldData: { data: ConversationWithVisitorDto[] } | undefined) => {
            if (!oldData?.data) return oldData;

            const convIndex = oldData.data.findIndex(
              (c: ConversationWithVisitorDto) =>
                c.conversation.id === data.conversationId,
            );
            if (convIndex === -1) {
              // Brand new conversation we don't have visitor details for; gracefully fallback to refetch
              queryClient.invalidateQueries({ queryKey: ["conversations"] });
              return oldData;
            }

            // Remove it from current position and move to the top
            const newData = [...oldData.data];
            const [updatedConv] = newData.splice(convIndex, 1);

            // Update timestamp
            updatedConv.conversation.updatedAt = data.createdAt;

            return {
              ...oldData,
              data: [updatedConv, ...newData], // Top of the list
            };
          },
        );
      });
      timeOutRef.current = setInterval(() => {
        parrotClient.ws.emit("ping", {
          tenantId: session?.user?.activeTenantId,
        });
      }, 5000);
    } else if (status !== "authenticated") {
      console.log("Disconnecting WebSocket due to unauthenticated status.");
      if (timeOutRef.current) {
        clearInterval(timeOutRef.current);
      }
      parrotClient.ws.disconnect();
    }

    return () => {
      console.log("Provider unmounting, cleaning up WebSocket connection.");
      parrotClient.ws.disconnect();
    };
  }, [status, session?.user?.activeTenantId]);

  return (
    <WsContext.Provider value={{ ws: parrotClient.ws }}>
      {children}
    </WsContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WsContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
