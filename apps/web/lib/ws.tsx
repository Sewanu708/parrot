"use client";

import { ParrotClient } from "@parrot/sdk";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect } from "react";
import { parrotClient } from "./parrot";
import queryClient from "./query-client";

interface WsContextType {
  ws: ParrotClient["ws"] | null;
}

const WsContext = createContext<WsContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      console.log("Authenticated, ensuring WebSocket and SDK are connected.");
      parrotClient.setToken(session.user.sessionToken);
      parrotClient.setTenantId(session.user.activeTenantId || undefined);
      parrotClient.ws.connect({ type: "agent" });

      parrotClient.ws.on("message:new", (data) => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        console.log(`message received, ${data}`);
      });
    } else if (status !== "authenticated") {
      console.log("Disconnecting WebSocket due to unauthenticated status.");
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
