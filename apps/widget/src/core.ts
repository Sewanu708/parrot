import { WidgetApi } from "./api";
import { WidgetUI } from "./ui";
import type {
  WidgetState,
  WidgetMessage,
  UserContext,
  WidgetTab,
} from "./types";

export class ParrotWidget {
  private api!: WidgetApi;
  private ui!: WidgetUI;
  private state!: WidgetState;

  private typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastTypingEmit: number = 0;
  private isReturningVisitor: boolean = false;
  private isWsConnected: boolean = false;
  private hostOrigin: string | null = null;

  constructor() {
    const isStandalone = window.parent === window;
    // 1. Read propertyId and host from URL parameters or current script
    const urlParams = new URLSearchParams(window.location.search);
    const script =
      (document.currentScript as HTMLScriptElement) ||
      document.querySelector("script[data-property-id]");

    const propertyId =
      urlParams.get("propertyId") ||
      script?.getAttribute("data-property-id") ||
      "";

    // 2. Storage Hydration: localStorage for visitorId, sessionStorage for currentConversationId
    let visitorId = localStorage.getItem("parrot_visitor_id");
    if (visitorId) {
      this.isReturningVisitor = true;
    } else {
      visitorId = crypto.randomUUID();
      localStorage.setItem("parrot_visitor_id", visitorId);
      this.isReturningVisitor = false;
    }

    const currentConversationId = sessionStorage.getItem(
      "parrot_current_conversation_id",
    );

    // 3. Initialize State
    this.state = {
      isOpen: isStandalone,
      isOnline: false,
      activeTab: "chat",
      selectedConversationId: null,
      selectedConversationMessages: [],
      currentChatMessages: [],
      conversationsList: [],
      propertyConfig: null,
      propertyId,
      visitorId,
      currentConversationId,
      userContext: null,
      isTyping: false,
      isStandalone,
      isLoadingHistory: false,
    };

    this.ui = new WidgetUI();

    // 4. Bind UI Callbacks
    this.ui.onToggleOpen = () => this.toggleOpen();
    this.ui.onSendMessage = (text) => this.handleSend(text);
    this.ui.onTyping = () => this.handleTyping();
    this.ui.onSwitchTab = (tab) => this.switchTab(tab);
    this.ui.onSelectConversation = (convId) =>
      this.openConversationThread(convId);
    this.ui.onBackToMessages = () => this.backToMessages();

    // 5. Setup postMessage bridge if embedded in iframe
    if (!isStandalone) {
      this.setupPostMessageBridge();
    }

    // 6. Boot if propertyId is known upfront
    if (this.state.propertyId) {
      this.api = new WidgetApi(visitorId, this.state.propertyId);
      this.boot();
    }
  }

  private setupPostMessageBridge() {
    window.addEventListener("message", (event: MessageEvent) => {
      // Once hostOrigin is established, reject messages from any other origin
      if (this.hostOrigin !== null && event.origin !== this.hostOrigin) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== "object") return;

      switch (data.type) {
        case "PARROT_INIT": {
          // Lock to the browser-verified origin of the parent window
          this.hostOrigin = event.origin;

          if (data.propertyId && data.propertyId !== this.state.propertyId) {
            this.state.propertyId = data.propertyId;
          }

          this.api = new WidgetApi(this.state.visitorId, this.state.propertyId);

          if (data.user) {
            this.state.userContext = data.user as UserContext;
          }

          this.boot();
          break;
        }
        case "PARROT_OPEN": {
          this.setOpen(true);
          break;
        }
        case "PARROT_CLOSE": {
          this.setOpen(false);
          break;
        }
        case "PARROT_IDENTIFY": {
          if (data.user) {
            this.state.userContext = data.user as UserContext;
            if (this.isReturningVisitor && this.api) {
              this.api.identify(this.state.userContext);
            }
          }
          break;
        }
        case "PARROT_RESET": {
          this.handleReset();
          break;
        }
      }
    });

    // Notify parent host that iframe is ready to receive config
    window.parent.postMessage({ type: "PARROT_READY" }, "*");
  }

  private async boot() {
    if (!this.state.propertyId || !this.api) return;

    // 1. Fetch Property Config
    const config = await this.api.fetchConfig();
    if (config) {
      this.state.propertyConfig = config;
      this.state.isOnline = config.isOnline;

      // Validate custom attributes payload if debug mode is active
      if (this.state.userContext?.custom && config.customAttributes) {
        const allowedKeys = new Set(
          config.customAttributes.map((attr) => attr.key),
        );
        Object.keys(this.state.userContext.custom).forEach((key) => {
          if (!allowedKeys.has(key)) {
            console.warn(
              `[Parrot SDK] Custom attribute '${key}' is not registered in Dashboard Settings > Custom Attributes.`,
            );
          }
        });
      }

      this.render();
    }

    // 2. Returning visitor: sync user context & connect WebSocket immediately
    if (this.isReturningVisitor) {
      if (this.state.userContext) {
        await this.api.identify(this.state.userContext);
      }
      this.ensureWebSocketConnected();
    }

    // 3. Hydrate current conversation messages if active tab session exists
    if (this.state.currentConversationId) {
      this.state.currentChatMessages = await this.api.fetchMessageHistory(
        this.state.currentConversationId,
      );
      this.render();
    }

    // 4. Hydrate past conversations list for Messages tab
    this.refreshConversationsList();
  }

  private ensureWebSocketConnected() {
    if (this.isWsConnected || !this.api) return;
    this.isWsConnected = true;

    this.api.connectWebSocket(
      () => this.state.currentConversationId,
      (msg) => this.receiveMessage(msg),
      () => this.receiveTyping(),
    );
  }

  private async refreshConversationsList() {
    if (!this.api || !this.state.propertyId) return;
    const list = await this.api.fetchConversations();
    this.state.conversationsList = list;
    this.render();
  }

  private render() {
    this.ui.render(this.state);
  }

  // --- Actions ---

  private toggleOpen() {
    this.setOpen(!this.state.isOpen);
  }

  private setOpen(open: boolean) {
    this.state.isOpen = open;
    this.render();

    if (!this.state.isStandalone && this.hostOrigin) {
      window.parent.postMessage(
        { type: "PARROT_RESIZE", isOpen: this.state.isOpen },
        this.hostOrigin,
      );
    }
  }

  private switchTab(tab: WidgetTab) {
    this.state.activeTab = tab;
    if (tab === "messages") {
      this.refreshConversationsList();
    }
    this.render();
  }

  private async openConversationThread(conversationId: string) {
    this.state.selectedConversationId = conversationId;
    this.state.isLoadingHistory = true;
    this.state.activeTab = "thread";
    this.render();

    const messages = await this.api.fetchMessageHistory(conversationId);
    this.state.selectedConversationMessages = messages;
    this.state.isLoadingHistory = false;
    this.render();
  }

  private backToMessages() {
    this.state.selectedConversationId = null;
    this.state.selectedConversationMessages = [];
    this.state.activeTab = "messages";
    this.render();
  }

  private async handleSend(text: string) {
    if (!text.trim()) return;

    // Optimistic append to current chat
    const tempMsg: WidgetMessage = {
      senderType: "visitor",
      body: text,
      createdAt: new Date().toISOString(),
    };
    this.state.currentChatMessages.push(tempMsg);
    this.render();

    try {
      const convId = await this.api.sendMessage(
        text,
        this.state.currentConversationId,
      );

      if (convId) {
        const isFirstMessage = !this.state.currentConversationId;
        this.state.currentConversationId = convId;
        sessionStorage.setItem("parrot_current_conversation_id", convId);

        if (isFirstMessage) {
          this.isReturningVisitor = true;

          // Enrich visitor with tenant user context after first message
          if (this.state.userContext) {
            this.api.identify(this.state.userContext).catch(() => {});
          }

          // Connect WebSocket now that visitor record is in DB
          this.ensureWebSocketConnected();
          this.refreshConversationsList();
        }
      }
    } catch (error) {
      console.error("[Parrot Widget] Failed to send message:", error);
    }
  }

  private handleTyping() {
    if (!this.state.currentConversationId) return;
    const now = Date.now();
    if (now - this.lastTypingEmit > 2000) {
      this.api.emitTyping(this.state.currentConversationId);
      this.lastTypingEmit = now;
    }
  }

  private receiveMessage(msg: WidgetMessage) {
    if (msg.senderType === "visitor") return;

    this.state.isTyping = false;
    this.state.currentChatMessages.push(msg);

    // If viewing selected thread and message belongs to it, update that too
    if (
      this.state.activeTab === "thread" &&
      this.state.selectedConversationId === this.state.currentConversationId
    ) {
      this.state.selectedConversationMessages.push(msg);
    }

    this.render();
    this.refreshConversationsList();
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

  private handleReset() {
    localStorage.removeItem("parrot_visitor_id");
    sessionStorage.removeItem("parrot_current_conversation_id");

    if (this.api) {
      this.api.disconnectWebSocket();
    }
    this.isWsConnected = false;
    this.isReturningVisitor = false;

    const newVisitorId = crypto.randomUUID();
    localStorage.setItem("parrot_visitor_id", newVisitorId);
    this.state.visitorId = newVisitorId;
    this.state.currentConversationId = null;
    this.state.currentChatMessages = [];
    this.state.selectedConversationMessages = [];
    this.state.conversationsList = [];
    this.state.activeTab = "chat";

    if (this.state.propertyId) {
      this.api = new WidgetApi(
        newVisitorId,
        this.state.propertyId,
      );
      this.boot();
    }
  }
}

