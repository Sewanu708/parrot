import { WidgetState } from "./types";
// @ts-ignore: CSS module import handled by bundler
import styles from "./styles/main.css?inline";

export class WidgetUI {
  private shadowRoot: ShadowRoot;

  // DOM Refs
  private container: HTMLDivElement;
  private chatWindow: HTMLDivElement;
  private messagesContainer: HTMLDivElement;
  private inputField: HTMLInputElement;
  private chatFooter: HTMLDivElement;
  private headerTitle: HTMLSpanElement;
  private headerLogo: HTMLImageElement;
  private statusDot: HTMLDivElement;
  private typingIndicator: HTMLDivElement | null = null;

  // Callbacks
  public onToggleOpen?: () => void;
  public onSendMessage?: (text: string) => void;
  public onTyping?: () => void;

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
    this.chatWindow = this.shadowRoot.getElementById("chat-window") as HTMLDivElement;
    this.messagesContainer = this.shadowRoot.getElementById("messages-container") as HTMLDivElement;
    this.inputField = this.shadowRoot.getElementById("chat-input") as HTMLInputElement;
    this.chatFooter = this.shadowRoot.getElementById("chat-footer") as HTMLDivElement;
    this.headerTitle = this.shadowRoot.getElementById("brand-name") as HTMLSpanElement;
    this.headerLogo = this.shadowRoot.getElementById("brand-logo") as HTMLImageElement;
    this.statusDot = this.shadowRoot.getElementById("status-dot") as HTMLDivElement;

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
        </div>
        
        <div class="chat-messages" id="messages-container"></div>
        
        <div class="chat-footer" id="chat-footer">
          <div class="chat-input-wrapper">
            <input type="text" class="chat-input" id="chat-input" placeholder="Type a message..." />
            <button class="send-btn" id="send-btn">
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
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

    const toggle = () => this.onToggleOpen && this.onToggleOpen();
    toggleBtn?.addEventListener("click", toggle);
    closeBtn?.addEventListener("click", toggle);

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
    // 1. Visibility
    const launcher = this.shadowRoot.getElementById("launcher-btn");
    if (state.isOpen) {
      this.chatWindow.classList.add("open");
      launcher?.classList.add("open");
      this.inputField.focus();
    } else {
      this.chatWindow.classList.remove("open");
      launcher?.classList.remove("open");
    }

    // 2. Config Injection
    if (state.propertyConfig) {
      this.headerTitle.innerText = state.propertyConfig.name || "Support";
      if (state.propertyConfig.logoUrl) {
        this.headerLogo.src = state.propertyConfig.logoUrl;
        this.headerLogo.style.display = "block";
      }
      
      const themeColor = state.propertyConfig.brandColor;
      if (themeColor) {
        this.container.style.setProperty("--primary", themeColor);
        // compute a darker hover color (simple approach)
        this.container.style.setProperty("--primary-hover", themeColor);
      }
    }

    // 3. Online/Offline Status Rendering
    const statusText = this.shadowRoot.getElementById("status-text");
    if (statusText) {
      if (state.isOnline) {
        this.statusDot.classList.remove("offline");
        statusText.innerText = "We're online";
        this.renderChatMessages(state);
      } else {
        this.statusDot.classList.add("offline");
        statusText.innerText = "We're away";
        this.renderOfflineForm();
      }
    }

    // 4. Typing Indicator
    if (state.isTyping && state.isOnline) {
      this.showTypingIndicator();
    } else {
      this.hideTypingIndicator();
    }
  }

  private renderChatMessages(state: WidgetState) {
    this.chatFooter.style.display = "flex"; // Show input

    // Only update if there's a difference in length (simplistic diffing)
    // In a real app we'd diff properly, but we'll rebuild for now
    const html = state.messages.map((m) => `
      <div class="msg-wrapper msg-${m.senderType}">
        <div class="msg-bubble">
          ${this.escapeHtml(m.body)}
        </div>
      </div>
    `).join("");

    if (this.messagesContainer.innerHTML !== html) {
      this.messagesContainer.innerHTML = html;
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private renderOfflineForm() {
    this.chatFooter.style.display = "none"; // Hide input
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

  private escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
  }
}
