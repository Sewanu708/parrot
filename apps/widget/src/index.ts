import { ParrotClient, MessageDto } from "@parrot/sdk";

export interface WidgetMessage {
  id?: string;
  senderType: "visitor" | "agent";
  body: string;
  createdAt: string;
}

class Parrot {
  private propertyId: string | null = null;
  private tenantId: string | null = null;
  private visitorId: string;
  private conversationId: string | null = null;
  private apiHost: string = "http://localhost:8080";
  private wsHost: string = "ws://localhost:8080";

  private client: ParrotClient;
  private messages: WidgetMessage[] = [];

  private shadowRoot: ShadowRoot | null = null;
  private isChatOpen: boolean = false;

  constructor() {
    // 1. Fetch property ID & config from the script data tags
    this.initScriptConfig();

    // 2. Resolve visitorId from localStorage
    this.visitorId = this.getOrCreateVisitorId();
    this.conversationId = localStorage.getItem("parrot_conversation_id");

    // 3. Initialize SDK Client
    this.client = new ParrotClient({ baseUrl: this.apiHost });

    // 4. Initialize UI (Shadow DOM)
    this.initUI();

    // 5. Establish WebSocket Connection
    this.connectWebSocket();

    // 6. Fetch previous messages if conversation exists
    if (this.conversationId) {
      this.fetchMessageHistory();
    }
  }

  /**
   * Reads data attributes from the <script> tag embedding the widget
   */
  private initScriptConfig() {
    const script =
      (document.currentScript as HTMLScriptElement) ||
      document.querySelector("script[data-property-id]") ||
      document.querySelector("script[data-widget-key]");

    if (script) {
      this.propertyId =
        script.getAttribute("data-property-id") ||
        script.getAttribute("data-widget-key");
      this.tenantId = script.getAttribute("data-tenant-id");
      const customApi = script.getAttribute("data-api-host");
      if (customApi) {
        this.apiHost = customApi;
        this.wsHost = customApi.replace(/^http/, "ws");
      }
    }

    if (!this.propertyId) {
      console.warn(
        "[Parrot Widget] Missing data-property-id or data-widget-key attribute.",
      );
    }
  }

  /**
   * Get persistent visitor ID from localStorage or generate a new one
   */
  private getOrCreateVisitorId(): string {
    let id = localStorage.getItem("parrot_visitor_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("parrot_visitor_id", id);
    }
    return id;
  }

  private connectWebSocket() {
    try {
      this.client.ws.connect({ type: "visitor", visitorId: this.visitorId });

      this.client.ws.on("connect", () => {
        console.log("[Parrot Widget] WebSocket connected.");
      });

      this.client.ws.on("message:new", (data) => {
        this.handleIncomingMessage({
          id: data.id,
          senderType: data.senderType,
          body: data.body,
          createdAt: data.createdAt,
        });
      });

      this.client.ws.on("error", (error) => {
        console.error("[Parrot Widget] WebSocket error:", error);
      });
    } catch (e) {
      console.error("[Parrot Widget] Failed to initialize WebSocket:", e);
    }
  }

  /**
   * Fetch conversation history for returning visitors
   */
  private async fetchMessageHistory() {
    if (!this.conversationId) return;
    try {
      const res = await this.client.conversation.getMessages(
        this.conversationId,
      );
      if (res.data && Array.isArray(res.data)) {
        this.messages = res.data.map((msg: MessageDto) => ({
          id: msg.id,
          senderType: msg.senderType === "visitor" ? "visitor" : "agent",
          body: msg.body || "",
          createdAt: msg.createdAt,
        }));
        this.renderMessages();
      }
    } catch (err) {
      console.error("[Parrot Widget] Failed to load message history:", err);
    }
  }

  /**
   * Send a visitor message via HTTP API
   */
  private async sendMessage(text: string) {
    if (!text.trim() || !this.propertyId) return;

    const tempMsg: WidgetMessage = {
      senderType: "visitor",
      body: text,
      createdAt: new Date().toISOString(),
    };

    this.messages.push(tempMsg);
    this.renderMessages();

    try {
      const payload = {
        ...(this.conversationId && { conversationId: this.conversationId }),
        propertyId: this.propertyId,
        clientVisitorId: this.visitorId,
        body: text,
      };
      const res = await this.client.widget.sendMessage(payload);

      if (res.data) {
        if (res.data.conversationId) {
          this.conversationId = res.data.conversationId;
          localStorage.setItem(
            "parrot_conversation_id",
            res.data.conversationId,
          );
        }
      }
    } catch (err) {
      console.error("[Parrot Widget] Failed to send message:", err);
    }
  }

  /**
   * Handle real-time incoming message from WebSocket
   */
  private handleIncomingMessage(msg: WidgetMessage) {
    // Prevent duplicate rendering of visitor's own message sent via HTTP
    if (msg.senderType === "visitor") return;

    this.messages.push(msg);
    this.renderMessages();
  }

  /**
   * Mounts the widget inside a Shadow DOM container
   */
  private initUI() {
    const container = document.createElement("div");
    container.id = "parrot-widget-host";
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    document.body.appendChild(container);
    this.shadowRoot = container.attachShadow({ mode: "open" });

    // Inject isolated widget styles & HTML structure
    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .launcher-btn {
          width: 60px;
          height: 60px;
          border-radius: 30px;
          background: #4f46e5;
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, background 0.2s;
        }
        .launcher-btn:hover { transform: scale(1.05); background: #4338ca; }

        .chat-window {
          display: none;
          flex-direction: column;
          width: 370px;
          height: 520px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          overflow: hidden;
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
        }

        .chat-window.open { display: flex; }

        .chat-header {
          background: #4f46e5;
          color: white;
          padding: 16px;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 18px; }

        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #f9fafb;
        }

        .msg-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.4;
          word-break: break-word;
        }
        .msg-visitor {
          align-self: flex-end;
          background: #4f46e5;
          color: white;
          border-bottom-right-radius: 2px;
        }
        .msg-agent {
          align-self: flex-start;
          background: #e5e7eb;
          color: #1f2937;
          border-bottom-left-radius: 2px;
        }

        .chat-footer {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
          background: white;
        }

        .chat-input {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          padding: 8px 14px;
          font-size: 14px;
          outline: none;
        }
        .chat-input:focus { border-color: #4f46e5; }

        .send-btn {
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          cursor: pointer;
          font-weight: bold;
        }
      </style>

      <div class="chat-window" id="chat-window">
        <div class="chat-header">
          <span>Support Chat</span>
          <button class="close-btn" id="close-btn">✕</button>
        </div>
        <div class="chat-messages" id="messages-container"></div>
        <div class="chat-footer">
          <input type="text" class="chat-input" id="chat-input" placeholder="Type a message..." />
          <button class="send-btn" id="send-btn">➔</button>
        </div>
      </div>

      <button class="launcher-btn" id="launcher-btn">
        💬
      </button>
    `;

    this.attachUIEvents();
  }

  /**
   * Attach click & submit event listeners inside Shadow DOM
   */
  private attachUIEvents() {
    if (!this.shadowRoot) return;

    const launcherBtn = this.shadowRoot.getElementById("launcher-btn");
    const closeBtn = this.shadowRoot.getElementById("close-btn");
    const chatWindow = this.shadowRoot.getElementById("chat-window");
    const sendBtn = this.shadowRoot.getElementById("send-btn");
    const chatInput = this.shadowRoot.getElementById(
      "chat-input",
    ) as HTMLInputElement;

    const toggleChat = () => {
      this.isChatOpen = !this.isChatOpen;
      chatWindow?.classList.toggle("open", this.isChatOpen);
    };

    launcherBtn?.addEventListener("click", toggleChat);
    closeBtn?.addEventListener("click", toggleChat);

    const handleSend = () => {
      const text = chatInput.value;
      if (text) {
        this.sendMessage(text);
        chatInput.value = "";
      }
    };

    sendBtn?.addEventListener("click", handleSend);
    chatInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSend();
    });
  }

  /**
   * Re-render message list in Shadow DOM
   */
  private renderMessages() {
    if (!this.shadowRoot) return;

    const container = this.shadowRoot.getElementById("messages-container");
    if (!container) return;

    container.innerHTML = this.messages
      .map(
        (m) => `
        <div class="msg-bubble ${m.senderType === "visitor" ? "msg-visitor" : "msg-agent"}">
          ${this.escapeHtml(m.body)}
        </div>
      `,
      )
      .join("");

    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  private escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
  }
}

// Auto-initialize when loaded
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new Parrot());
  } else {
    new Parrot();
  }
}
