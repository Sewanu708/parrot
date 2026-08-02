import { WidgetApi } from "./api";
import { WidgetUI } from "./ui";
import { WidgetState, WidgetMessage } from "./types";

export class ParrotWidget {
  private api!: WidgetApi;
  private ui!: WidgetUI;
  private state!: WidgetState;

  private typingTimeout: any = null;
  private lastTypingEmit: number = 0;

  constructor() {
    // 1. Parse Script Tag attributes
    const script = (document.currentScript as HTMLScriptElement) || document.querySelector("script[data-property-id]");
    const propertyId = script?.getAttribute("data-property-id");
    const host = script?.getAttribute("data-host") || "http://localhost:8080";

    if (!propertyId) {
      console.warn("[Parrot Widget] Missing data-property-id attribute.");
      return; // Abort
    }

    // 2. Hydrate IDs from LocalStorage
    let visitorId = localStorage.getItem("parrot_visitor_id");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("parrot_visitor_id", visitorId);
    }
    const conversationId = localStorage.getItem("parrot_conversation_id");

    
    this.api = new WidgetApi(host,visitorId,propertyId)
    this.ui = new WidgetUI()

    // 3. Init State
    this.state = {
      isOpen: false,
      isOnline: false, // Default false until config fetched
      messages: [],
      propertyConfig: null,
      propertyId,
      visitorId,
      conversationId,
      isTyping: false
    };

    // 4. Init Modules
    this.api = new WidgetApi(host, visitorId, propertyId);
    this.ui = new WidgetUI();

    // 5. Bind UI Callbacks
    this.ui.onToggleOpen = () => this.toggleOpen();
    this.ui.onSendMessage = (text) => this.handleSend(text);
    this.ui.onTyping = () => this.handleTyping();

    // 6. Boot
    this.boot();
  }

  private async boot() {
    // Fetch Settings & determine Online/Offline Status
    const config = await this.api.fetchConfig();
    if (config) {
      this.state.propertyConfig = config;
      this.state.isOnline = config.isOnline;
      this.render();
    }

    // Fetch message history if convo exists
    if (this.state.conversationId) {
      this.state.messages = await this.api.fetchMessageHistory(this.state.conversationId);
      this.render();
    }

    // Connect WS
    this.api.connectWebSocket(
      this.state.conversationId,
      (msg) => this.receiveMessage(msg),
      () => this.receiveTyping()
    );
  }

  private render() {
    this.ui.render(this.state);
  }

  // --- Actions ---

  private toggleOpen() {
    this.state.isOpen = !this.state.isOpen;
    this.render();
  }

  private async handleSend(text: string) {
    if (!text.trim()) return;

    // Optimistic append
    const tempMsg: WidgetMessage = {
      senderType: "visitor",
      body: text,
      createdAt: new Date().toISOString(),
    };
    this.state.messages.push(tempMsg);
    this.render();

    // API Call
    const newConvId = await this.api.sendMessage(text, this.state.conversationId);
    if (newConvId && newConvId !== this.state.conversationId) {
      this.state.conversationId = newConvId;
      localStorage.setItem("parrot_conversation_id", newConvId);
      // Ensure WS knows about the new conversation if it needs to (it's handled by server emitting to visitor ID)
    }
  }

  private handleTyping() {
    if (!this.state.conversationId) return;
    const now = Date.now();
    if (now - this.lastTypingEmit > 2000) {
      this.api.emitTyping(this.state.conversationId);
      this.lastTypingEmit = now;
    }
  }

  private receiveMessage(msg: WidgetMessage) {
    if (msg.senderType === "visitor") return; // Ignore own WS echoes
    
    this.state.isTyping = false; // Cancel typing
    this.state.messages.push(msg);
    this.render();
  }

  private receiveTyping() {
    this.state.isTyping = true;
    this.render();

    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.state.isTyping = false;
      this.render();
    }, 3000);
  }
}
