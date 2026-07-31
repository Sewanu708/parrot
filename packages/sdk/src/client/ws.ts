import { ParrotClientOptions } from "./http";

//  lifecycles to manage -> connecting, connected (open), close (disconnet) onMessage , onError
// What we need. emit, receive

class WsClient {
  private readonly url: string;
  private ws: WebSocket | null = null;
  private isConnecting: boolean = false;
  private intentionallyClosed: boolean = false;
  private token?: string;
  private userId?: string;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastConnectionParams: any = null;

  constructor(parrotClientOptions: ParrotClientOptions) {
    const httpUrl =
      parrotClientOptions.baseUrl ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:8080";

    this.url = httpUrl.replace(/^http/, "ws").replace(/\/api$/, "");
    this.token = parrotClientOptions.token;
    this.userId = parrotClientOptions.userId;
  }

  setuserId(userId: string | undefined) {
    this.userId = userId;
  }
  connect({
    type,
    visitorId,
    userId,
    tenantId,
  }: {
    type: "visitor" | "agent";
    visitorId?: string;
    userId?: string;
    tenantId?: string;
  }) {
    // Store connection params for reconnection attempts
    this.lastConnectionParams = { type, visitorId, userId, tenantId };

    if (this.ws || this.isConnecting) return;
    this.isConnecting = true;
    try {
      const standardUrl = new URL(`${this.url}/ws`);
      if (this.token) standardUrl.searchParams.append("token", this.token);
      
      const actualUserId = userId || this.userId;
      if (actualUserId)
        standardUrl.searchParams.append("userId", actualUserId);
        
      if (tenantId)
        standardUrl.searchParams.append("tenantId", tenantId);
        
      if (visitorId) standardUrl.searchParams.append("visitorId", visitorId);
      standardUrl.searchParams.append("type", type);

      this.ws = new WebSocket(standardUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log("WebSocket connected successfully.");
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this._trigger("connect", null);
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        if (!this.intentionallyClosed) {
          this._reconnect();
        }
        this._trigger("disconnect", null);
      };

      this.ws.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event?.data);
          const type = parsedData.type || parsedData.event;
          const payload =
            parsedData.payload !== undefined
              ? parsedData.payload
              : parsedData.data;

          if (type) {
            this._trigger(type, payload);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message", error);
          this._trigger("error", {
            message: "Failed to parse message",
            originalError: error,
          });
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this._trigger("error", error);
      };
    } catch (error) {
      console.error("Failed to initialize WebSocket connection:", error);
      this.isConnecting = false;
      this._trigger("error", {
        message: "Failed to connect",
        originalError: error,
      });
    }
  }

  on(key: string, cb: (data: any) => void) {
    if (!this.listeners.get(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)?.add(cb);
  }

  off(key: string, cb: (data: any) => void) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.delete(cb);
    }
  }

  disconnect() {
    this.intentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
    }
  }

  emit(key: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: key, payload: data }));
    } else {
      console.warn("WebSocket is not connected. Cannot emit event:", key);
    }
  }

  private _reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("WebSocket: Max reconnect attempts reached.");
      return;
    }

    this.reconnectAttempts++;
    const delay =
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    console.log(
      `WebSocket: Connection lost. Reconnecting in ${delay / 1000}s... (Attempt ${this.reconnectAttempts})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.lastConnectionParams);
    }, delay);
  }

  private _trigger(key: string, data: any) {
    const callback = this.listeners.get(key);
    if (callback) {
      callback.forEach((cb) => cb(data));
    }
  }
}

export { WsClient };
