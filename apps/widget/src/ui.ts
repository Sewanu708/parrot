import type { WidgetState, WidgetTab, WidgetMessage } from "./types";
import type { WidgetConversationPreviewDto } from "@parrot/sdk";
// @ts-ignore: CSS module import handled by bundler
import styles from "./styles/main.css?inline";

export class WidgetUI {
  private shadowRoot: ShadowRoot;

  // DOM Refs
  private container: HTMLDivElement;
  private chatWindow: HTMLDivElement;
  private messagesContainer: HTMLDivElement;
  private conversationsContainer: HTMLDivElement;
  private threadBar: HTMLDivElement;
  private inputField: HTMLInputElement;
  private chatFooter: HTMLDivElement;
  private threadNotice: HTMLDivElement;
  private headerTitle: HTMLSpanElement;
  private headerLogo: HTMLImageElement;
  private statusDot: HTMLDivElement;
  private tabChat: HTMLButtonElement;
  private tabMessages: HTMLButtonElement;
  private typingIndicator: HTMLDivElement | null = null;

  // Callbacks
  public onToggleOpen?: () => void;
  public onSendMessage?: (text: string) => void;
  public onTyping?: () => void;
  public onSwitchTab?: (tab: WidgetTab) => void;
  public onSelectConversation?: (conversationId: string) => void;
  public onBackToMessages?: () => void;

  constructor() {
    const host = document.createElement("div");
    host.id = "parrot-widget-host";
    host.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
    `;
    document.body.appendChild(host);
    this.shadowRoot = host.attachShadow({ mode: "open" });

    // Inject compiled CSS string
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    this.shadowRoot.appendChild(styleSheet);

    this.shadowRoot.innerHTML += this.getTemplate();

    // Bind DOM refs
    this.container = host;
    this.chatWindow = this.shadowRoot.getElementById(
      "chat-window",
    ) as HTMLDivElement;
    this.messagesContainer = this.shadowRoot.getElementById(
      "messages-container",
    ) as HTMLDivElement;
    this.conversationsContainer = this.shadowRoot.getElementById(
      "conversations-container",
    ) as HTMLDivElement;
    this.threadBar = this.shadowRoot.getElementById(
      "thread-bar",
    ) as HTMLDivElement;
    this.inputField = this.shadowRoot.getElementById(
      "chat-input",
    ) as HTMLInputElement;
    this.chatFooter = this.shadowRoot.getElementById(
      "chat-footer",
    ) as HTMLDivElement;
    this.threadNotice = this.shadowRoot.getElementById(
      "thread-notice",
    ) as HTMLDivElement;
    this.headerTitle = this.shadowRoot.getElementById(
      "brand-name",
    ) as HTMLSpanElement;
    this.headerLogo = this.shadowRoot.getElementById(
      "brand-logo",
    ) as HTMLImageElement;
    this.statusDot = this.shadowRoot.getElementById(
      "status-dot",
    ) as HTMLDivElement;
    this.tabChat = this.shadowRoot.getElementById(
      "tab-chat",
    ) as HTMLButtonElement;
    this.tabMessages = this.shadowRoot.getElementById(
      "tab-messages",
    ) as HTMLButtonElement;

    this.attachEvents();
  }

  private getTemplate() {
    return `
      <div class="chat-window" id="chat-window">
        <div class="chat-header">
          <div class="chat-header-top">
            <div class="brand-info">
              <img id="brand-logo" class="brand-logo" src="" style="display:none;" />
              <div>
                <div class="brand-name" id="brand-name">Support</div>
                <div class="status-indicator">
                  <div class="status-dot" id="status-dot"></div>
                  <span id="status-text">Connecting...</span>
                </div>
              </div>
            </div>
            <button class="close-btn" id="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>

          <div class="chat-tabs" id="chat-tabs">
            <button class="chat-tab active" id="tab-chat">Chat</button>
            <button class="chat-tab" id="tab-messages">Messages</button>
          </div>
        </div>

        <div class="thread-bar" id="thread-bar" style="display: none;">
          <button class="back-btn" id="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            Back to Messages
          </button>
        </div>
        
        <div class="chat-messages" id="messages-container"></div>
        <div class="conversations-container" id="conversations-container" style="display: none;"></div>
        
        <div class="chat-footer" id="chat-footer">
          <div class="chat-input-wrapper">
            <input type="text" class="chat-input" id="chat-input" placeholder="Type a message..." />
            <button class="send-btn" id="send-btn">
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>

        <div class="thread-readonly-notice" id="thread-notice" style="display: none;">
          Past conversation thread. Switch to the Chat tab to start a new message.
        </div>
      </div>

      <button class="launcher-btn" id="launcher-btn">
        <svg viewBox="0 0 24 24" class="chat-icon"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        <svg viewBox="0 0 24 24" class="close-icon"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    `;
  }

  private attachEvents() {
    const toggleBtn = this.shadowRoot.getElementById("launcher-btn");
    const closeBtn = this.shadowRoot.getElementById("close-btn");
    const sendBtn = this.shadowRoot.getElementById("send-btn");
    const backBtn = this.shadowRoot.getElementById("back-btn");

    const toggle = () => this.onToggleOpen && this.onToggleOpen();
    toggleBtn?.addEventListener("click", toggle);
    closeBtn?.addEventListener("click", toggle);

    this.tabChat?.addEventListener("click", () => {
      this.onSwitchTab && this.onSwitchTab("chat");
    });

    this.tabMessages?.addEventListener("click", () => {
      this.onSwitchTab && this.onSwitchTab("messages");
    });

    backBtn?.addEventListener("click", () => {
      this.onBackToMessages && this.onBackToMessages();
    });

    const submit = () => {
      const text = this.inputField.value.trim();
      if (text && this.onSendMessage) {
        this.onSendMessage(text);
        this.inputField.value = "";
      }
    };

    sendBtn?.addEventListener("click", submit);
    this.inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") submit();
    });

    this.inputField.addEventListener("input", () => {
      this.onTyping && this.onTyping();
    });
  }

  render(state: WidgetState) {
    // 1. Visibility and Standalone Mode
    const launcher = this.shadowRoot.getElementById("launcher-btn");
    const closeBtn = this.shadowRoot.getElementById("close-btn");

    if (state.isStandalone) {
      this.chatWindow.classList.add("standalone");
      if (launcher) launcher.style.display = "none";
      if (closeBtn) closeBtn.style.display = "none";
    } else {
      if (state.isOpen) {
        this.chatWindow.classList.add("open");
        launcher?.classList.add("open");
        this.inputField.focus();
      } else {
        this.chatWindow.classList.remove("open");
        launcher?.classList.remove("open");
      }
    }

    // 2. Config & Branding
    if (state.propertyConfig) {
      this.headerTitle.innerText = state.propertyConfig.name || "Support";
      if (state.propertyConfig.logoUrl) {
        this.headerLogo.src = state.propertyConfig.logoUrl;
        this.headerLogo.style.display = "block";
      }

      const themeColor = state.propertyConfig.brandColor;
      if (themeColor) {
        this.container.style.setProperty("--primary", themeColor);
        this.container.style.setProperty("--primary-hover", themeColor);
      }
    }

    // 3. Status Indicator
    const statusText = this.shadowRoot.getElementById("status-text");
    if (statusText) {
      if (state.isOnline) {
        this.statusDot.classList.remove("offline");
        statusText.innerText = "We're online";
      } else {
        this.statusDot.classList.add("offline");
        statusText.innerText = "We're away";
      }
    }

    // 4. Tab Highlight
    if (state.activeTab === "chat") {
      this.tabChat.classList.add("active");
      this.tabMessages.classList.remove("active");
    } else {
      this.tabChat.classList.remove("active");
      this.tabMessages.classList.add("active");
    }

    // 5. Tab Content Rendering
    if (state.activeTab === "chat") {
      this.threadBar.style.display = "none";
      this.conversationsContainer.style.display = "none";
      this.messagesContainer.style.display = "flex";
      this.threadNotice.style.display = "none";
      this.chatFooter.style.display = "flex";

      if (state.isOnline) {
        this.renderChatMessages(state.currentChatMessages);
      } else {
        this.renderOfflineForm();
      }
    } else if (state.activeTab === "messages") {
      this.threadBar.style.display = "none";
      this.messagesContainer.style.display = "none";
      this.conversationsContainer.style.display = "flex";
      this.threadNotice.style.display = "none";
      this.chatFooter.style.display = "none";

      this.renderConversationsList(state.conversationsList);
    } else if (state.activeTab === "thread") {
      this.threadBar.style.display = "flex";
      this.conversationsContainer.style.display = "none";
      this.messagesContainer.style.display = "flex";
      this.threadNotice.style.display = "block";
      this.chatFooter.style.display = "none";

      if (state.isLoadingHistory) {
        this.messagesContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-text">Loading conversation history...</div>
          </div>
        `;
      } else {
        this.renderChatMessages(state.selectedConversationMessages);
      }
    }

    // 6. Typing Indicator
    if (state.isTyping && state.isOnline && state.activeTab === "chat") {
      this.showTypingIndicator();
    } else {
      this.hideTypingIndicator();
    }
  }

  private renderChatMessages(messagesList: WidgetMessage[]) {
    if (messagesList.length === 0) {
      this.messagesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👋</div>
          <div class="empty-state-title">How can we help?</div>
          <div class="empty-state-text">Send us a message and our team will get back to you shortly.</div>
        </div>
      `;
      return;
    }

    const html = messagesList
      .map(
        (m) => `
        <div class="msg-wrapper msg-${m.senderType}">
          <div class="msg-bubble">
            ${this.escapeHtml(m.body)}
          </div>
        </div>
      `,
      )
      .join("");

    if (this.messagesContainer.innerHTML !== html) {
      this.messagesContainer.innerHTML = html;
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private renderConversationsList(list: WidgetConversationPreviewDto[]) {
    if (list.length === 0) {
      this.conversationsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">No conversations yet</div>
          <div class="empty-state-text">Your conversation history will appear here once you start chatting.</div>
        </div>
      `;
      return;
    }

    const cardsHtml = list
      .map((conv) => {
        const lastBody = conv.lastMessage?.body || "New conversation";
        const dateStr = this.formatRelativeTime(
          conv.lastMessage?.createdAt || conv.lastMessageAt,
        );
        const statusClass = `status-${conv.status}`;

        return `
          <div class="conversation-card" data-conversation-id="${conv.id}">
            <div class="conversation-card-header">
              <span class="conversation-status ${statusClass}">${conv.status}</span>
              <span class="conversation-date">${dateStr}</span>
            </div>
            <div class="conversation-snippet">${this.escapeHtml(lastBody)}</div>
          </div>
        `;
      })
      .join("");

    this.conversationsContainer.innerHTML = cardsHtml;

    // Attach click listeners to cards
    const cards =
      this.conversationsContainer.querySelectorAll(".conversation-card");
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-conversation-id");
        if (id && this.onSelectConversation) {
          this.onSelectConversation(id);
        }
      });
    });
  }

  private renderOfflineForm() {
    this.chatFooter.style.display = "none";
    this.messagesContainer.innerHTML = `
      <div class="offline-form">
        <div class="offline-icon">✉️</div>
        <div class="offline-title">Leave a message</div>
        <div class="offline-subtitle">We're currently offline, but we'll get back to you via email as soon as possible.</div>
        
        <input type="email" class="offline-input" placeholder="Your email address" id="offline-email" />
        <textarea class="offline-input" placeholder="How can we help?" id="offline-msg"></textarea>
        <button class="offline-submit" id="offline-submit">Send Message</button>
      </div>
    `;
  }

  private showTypingIndicator() {
    if (!this.typingIndicator) {
      this.typingIndicator = document.createElement("div");
      this.typingIndicator.className = "typing-indicator";
      this.typingIndicator.innerHTML = `
        Agent is typing
        <div class="dot"></div><div class="dot"></div><div class="dot"></div>
      `;
      this.messagesContainer.appendChild(this.typingIndicator);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private hideTypingIndicator() {
    if (this.typingIndicator && this.typingIndicator.parentNode) {
      this.typingIndicator.parentNode.removeChild(this.typingIndicator);
      this.typingIndicator = null;
    }
  }

  private formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  }

  private escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
  }
}

