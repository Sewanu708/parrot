import { WebSocket, WebSocketServer } from "ws";
import type { Server as HTTPServer } from "node:http";
import { logger } from "../logger";

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
}

export const wsGateway = new WSGateway();
