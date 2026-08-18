import type { UserContext } from "./types";
import { IFRAME_ORIGIN, resolveEmbedUrl } from "./config";

declare global {
  interface Window {
    Parrot: typeof Parrot;
  }
}

export interface ParrotOptions {
  propertyId: string;
  host?: string;
  user?: UserContext;
}

export class Parrot {
  private propertyId: string;
  private host: string;
  private userContext: UserContext | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private container: HTMLDivElement | null = null;
  private isReady: boolean = false;
  private pendingCalls: Array<() => void> = [];

  constructor(options: ParrotOptions) {
    if (!options.propertyId) {
      throw new Error("[Parrot SDK] 'propertyId' is required to initialize Parrot.");
    }

    this.propertyId = options.propertyId;
    this.host = options.host || "";
    if (options.user) {
      this.userContext = options.user;
    }

    if (typeof window !== "undefined") {
      this.mount();
      this.listenMessages();
    }
  }

  private mount() {
    const container = document.createElement("div");
    container.id = "parrot-sdk-container";
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 64px;
      height: 64px;
      z-index: 2147483647;
      transition: width 0.3s ease, height 0.3s ease;
      pointer-events: none;
    `;

    const iframe = document.createElement("iframe");
    iframe.id = "parrot-widget-frame";
    iframe.src = resolveEmbedUrl(this.propertyId, this.host);
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
      pointer-events: all;
      color-scheme: light;
    `;
    iframe.setAttribute("allow", "clipboard-write");
    iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin");

    container.appendChild(iframe);
    document.body.appendChild(container);

    this.container = container;
    this.iframe = iframe;
  }

  private listenMessages() {
    window.addEventListener("message", (event: MessageEvent) => {
      // Validate origin to reject untrusted messages
      if (IFRAME_ORIGIN && event.origin !== IFRAME_ORIGIN) return;

      const data = event.data;
      if (!data || typeof data !== "object") return;

      switch (data.type) {
        case "PARROT_READY": {
          this.isReady = true;
          this.sendInit();
          this.flushPendingCalls();
          break;
        }
        case "PARROT_RESIZE": {
          this.handleResize(Boolean(data.isOpen));
          break;
        }
      }
    });
  }

  private sendInit() {
    if (!this.iframe?.contentWindow) return;

    this.iframe.contentWindow.postMessage(
      {
        type: "PARROT_INIT",
        propertyId: this.propertyId,
        user: this.userContext,
        hostOrigin: window.location.origin,
      },
      IFRAME_ORIGIN,
    );
  }

  private handleResize(isOpen: boolean) {
    if (!this.container) return;

    const isMobile = window.innerWidth <= 480;

    if (isOpen) {
      if (isMobile) {
        this.container.style.width = "100vw";
        this.container.style.height = "100vh";
        this.container.style.bottom = "0";
        this.container.style.right = "0";
      } else {
        this.container.style.width = "400px";
        this.container.style.height = "620px";
        this.container.style.bottom = "20px";
        this.container.style.right = "20px";
      }
    } else {
      this.container.style.width = "64px";
      this.container.style.height = "64px";
      this.container.style.bottom = "20px";
      this.container.style.right = "20px";
    }
  }

  private postToIframe(type: string, payload?: Record<string, unknown>) {
    if (!this.isReady || !this.iframe?.contentWindow) {
      this.pendingCalls.push(() => this.postToIframe(type, payload));
      return;
    }

    this.iframe.contentWindow.postMessage(
      {
        type,
        ...payload,
      },
      IFRAME_ORIGIN,
    );
  }

  private flushPendingCalls() {
    while (this.pendingCalls.length > 0) {
      const fn = this.pendingCalls.shift();
      fn?.();
    }
  }

  // --- Public SDK Methods ---

  public open() {
    this.postToIframe("PARROT_OPEN");
  }

  public close() {
    this.postToIframe("PARROT_CLOSE");
  }

  public identify(user: UserContext) {
    this.userContext = user;
    this.postToIframe("PARROT_IDENTIFY", { user });
  }

  public reset() {
    this.userContext = null;
    this.postToIframe("PARROT_RESET");
  }
}

// Attach to window for script-tag usage
if (typeof window !== "undefined") {
  window.Parrot = Parrot;
}
