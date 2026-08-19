import {
  ParrotClient,
  type WidgetPropertyConfigDto,
  type MessageDto,
  type WidgetConversationPreviewDto,
} from "@parrot/sdk";
import type { WidgetMessage, UserContext } from "./types";
import { config } from "./config";

export class WidgetApi {
  private client: ParrotClient;

  constructor(
    private visitorId: string,
    private propertyId: string,
    apiHost: string = config.apiUrl,
  ) {
    this.client = new ParrotClient({
      baseUrl: apiHost,
    });
  }

  async fetchConfig(): Promise<WidgetPropertyConfigDto | null> {
    try {
      const res = await this.client.widget.fetchConfig(this.propertyId);
      return res.data || null;
    } catch (e) {
      console.error("[Parrot Widget] Failed to fetch config", e);
      return null;
    }
  }

  async identify(userContext: UserContext): Promise<boolean> {
    try {
      await this.client.widget.identify({
        propertyId: this.propertyId,
        clientVisitorId: this.visitorId,
        name: userContext.name,
        email: userContext.email,
        phone: userContext.phone,
        metadata: userContext.custom,
      });
      return true;
    } catch (e) {
      console.error("[Parrot Widget] Failed to identify visitor", e);
      return false;
    }
  }

  async fetchConversations(): Promise<WidgetConversationPreviewDto[]> {
    try {
      const res = await this.client.widget.getConversations(
        this.propertyId,
        this.visitorId,
      );
      return res.data || [];
    } catch (e) {
      console.error("[Parrot Widget] Failed to fetch conversations list", e);
      return [];
    }
  }

  async fetchMessageHistory(conversationId: string): Promise<WidgetMessage[]> {
    try {
      const res = await this.client.widget.getMessages(conversationId);
      if (res.data && Array.isArray(res.data)) {
        return res.data.map((msg: MessageDto) => ({
          id: msg.id,
          senderType: msg.senderType,
          body: msg.body || "",
          createdAt: msg.createdAt,
        }));
      }
      return [];
    } catch (e) {
      console.error("[Parrot Widget] Failed to load history", e);
      return [];
    }
  }

  async sendMessage(
    text: string,
    conversationId: string | null,
  ): Promise<string | null> {
    try {
      const payload = {
        ...(conversationId && { conversationId }),
        propertyId: this.propertyId,
        clientVisitorId: this.visitorId,
        body: text,
      };
      const res = await this.client.widget.sendMessage(payload);

      if (res.data && res.data.conversationId) {
        return res.data.conversationId;
      }
      return null;
    } catch (e) {
      console.error("[Parrot Widget] Failed to send message", e);
      return null;
    }
  }

  connectWebSocket(
    getActiveConversationId: () => string | null,
    onMessage: (msg: WidgetMessage) => void,
    onTyping: () => void,
  ) {
    try {
      this.client.ws.connect({
        type: "visitor",
        visitorId: this.visitorId,
        propertyId: this.propertyId,
      });

      this.client.ws.on("message:new", (data: {
        id: string;
        conversationId: string;
        senderType: "visitor" | "agent" | "system";
        body: string | null;
        createdAt: string;
      }) => {
        onMessage({
          id: data.id,
          senderType: data.senderType,
          body: data.body || "",
          createdAt: data.createdAt,
        });
      });

      this.client.ws.on("typing:start", (data: {
        conversationId: string;
        senderType: string;
      }) => {
        const currentConvId = getActiveConversationId();
        if (
          data.senderType === "agent" &&
          data.conversationId === currentConvId
        ) {
          onTyping();
        }
      });
    } catch (e) {
      console.error("[Parrot Widget] WS Error", e);
    }
  }

  emitTyping(conversationId: string) {
    this.client.ws.emit("typing:start", {
      conversationId,
      senderType: "visitor",
    });
  }

  disconnectWebSocket() {
    this.client.ws.disconnect();
  }
}

