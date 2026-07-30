import { WebSocket, WebSocketServer } from "ws";
import type { Server as HTTPServer } from "node:http";
import { logger } from "../logger";
import { db } from "@parrot/db/src/config";
import { conversations } from "@parrot/db/src/schema";
import { eq } from "drizzle-orm";

export interface WSEvent<T = any> {
  event: string;
  data: T;
}

export class WSGateway {
  private wss: WebSocketServer | null = null;

  // In-memory maps for v1
  private tenantSockets = new Map<string, Set<WebSocket>>();
  private visitorSockets = new Map<string, Set<WebSocket>>();

  /**
   * Attach WebSocket server to Node.js HTTP server
   */
  init(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (socket: WebSocket, request) => {
      logger.info("Websocket connection triggering");
      const url = new URL(request.url || "", `http://${request.headers.host}`);
      const clientType = url.searchParams.get("type"); // "agent" | "visitor"
      const tenantId = url.searchParams.get("tenantId");
      const visitorId = url.searchParams.get("visitorId");

      logger.info(
        { clientType, tenantId, visitorId },
        "New WebSocket connection",
      );

      if (clientType === "agent" && tenantId) {
        this.registerAgent(tenantId, socket);
      } else if (clientType === "visitor" && visitorId) {
        this.registerVisitor(visitorId, socket);
      } else {
        // Fallback or handshake reject
        socket.close(4000, "Missing client identification params");
        return;
      }

      socket.on("message", (rawData) => {
        try {
          logger.info("Message received!!!")
          const parsed = JSON.parse(rawData.toString());
          const { type, payload } = parsed;

          // Route ephemeral events
          if (type === "typing:start" || type === "typing:stop") {
            if (payload.targetVisitorId) {
              this.sendToVisitor(payload.targetVisitorId, { event: type, data: payload });
            } else if (payload.targetTenantId) {
              this.broadcastToTenant(payload.targetTenantId, { event: type, data: payload });
            } else if (payload.conversationId && payload.senderType === "visitor") {
              // Fallback: look up tenantId from DB
              this.getTenantIdFromConversation(payload.conversationId)
                .then((tenantId) => {
                  if (tenantId) {
                    this.broadcastToTenant(tenantId, { event: type, data: payload });
                  }
                })
                .catch((err) => logger.error({ err }, "Failed to lookup tenantId for WS event"));
            }
          }
        } catch (err) {
          logger.error({ err }, "Failed to process incoming WS message");
        }
      });

      socket.on("close", () => {
        if (tenantId) this.unregisterAgent(tenantId, socket);
        if (visitorId) this.unregisterVisitor(visitorId, socket);
      });

      socket.on("error", (err) => {
        logger.error({ err }, "WebSocket error");
      });
    });

    logger.info("WebSocket Gateway initialized on /ws");
  }

  registerAgent(tenantId: string, socket: WebSocket) {
    if (!this.tenantSockets.has(tenantId)) {
      this.tenantSockets.set(tenantId, new Set());
    }
    this.tenantSockets.get(tenantId)!.add(socket);
  }

  unregisterAgent(tenantId: string, socket: WebSocket) {
    const sockets = this.tenantSockets.get(tenantId);
    if (sockets) {
      sockets.delete(socket);
      if (sockets.size === 0) {
        this.tenantSockets.delete(tenantId);
      }
    }
  }

  registerVisitor(visitorId: string, socket: WebSocket) {
    if (!this.visitorSockets.has(visitorId)) {
      this.visitorSockets.set(visitorId, new Set());
    }
    this.visitorSockets.get(visitorId)!.add(socket);
  }

  unregisterVisitor(visitorId: string, socket: WebSocket) {
    const sockets = this.visitorSockets.get(visitorId);
    if (sockets) {
      sockets.delete(socket);
      if (sockets.size === 0) {
        this.visitorSockets.delete(visitorId);
      }
    }
  }

  /**
   * Broadcast an event to all connected agents of a tenant
   */
  broadcastToTenant(tenantId: string, payload: WSEvent) {
    const sockets = this.tenantSockets.get(tenantId);
    if (!sockets || sockets.size === 0) return;

    const messageStr = JSON.stringify(payload);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(messageStr);
      }
    }
  }

  /**
   * Send an event to a specific visitor
   */
  sendToVisitor(visitorId: string, payload: WSEvent) {
    const sockets = this.visitorSockets.get(visitorId);
    if (!sockets || sockets.size === 0) return;

    const messageStr = JSON.stringify(payload);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(messageStr);
      }
    }
  }

  /**
   * Helper function to fetch a tenantId given a conversationId
   */
  async getTenantIdFromConversation(conversationId: string): Promise<string | null> {
    const [conversation] = await db
      .select({ tenantId: conversations.tenantId })
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    
    return conversation?.tenantId || null;
  }
}

export const wsGateway = new WSGateway();
