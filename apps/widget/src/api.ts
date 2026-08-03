import { ParrotClient, WidgetPropertyConfigDto, MessageDto } from "@parrot/sdk";
import { WidgetMessage } from "./types";

export class WidgetApi {
  private client: ParrotClient;

  constructor(
    apiHost: string,
    private visitorId: string,
    private propertyId: string
  ) {
    this.client = new ParrotClient({ 
      baseUrl: apiHost,
      getToken: () => localStorage.getItem("parrot_visitor_token") || undefined
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

  async fetchMessageHistory(conversationId: string): Promise<WidgetMessage[]> {
    try {
      const res = await this.client.widget.getMessages(conversationId);
      if (res.data && Array.isArray(res.data)) {
        return res.data.map((msg: MessageDto) => ({
          id: msg.id,
          senderType: msg.senderType === "visitor" ? "visitor" : "agent",
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

  async sendMessage(text: string, conversationId: string | null): Promise<string | null> {
    try {
      const payload = {
        ...(conversationId && { conversationId }),
        propertyId: this.propertyId,
        clientVisitorId: this.visitorId,
        body: text,
      };
      const res = await this.client.widget.sendMessage(payload);
      
      if (res.data && res.data.token) {
        localStorage.setItem("parrot_visitor_token", res.data.token);
      }

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
    conversationId: string | null,
    onMessage: (msg: WidgetMessage) => void,
    onTyping: () => void
  ) {
    try {
      this.client.ws.connect({ type: "visitor", visitorId: this.visitorId });
      
      this.client.ws.on("message:new", (data: any) => {
        onMessage({
          id: data.id,
          senderType: data.senderType,
          body: data.body,
          createdAt: data.createdAt,
        });
      });

      this.client.ws.on("typing:start", (data: any) => {
        if (data.senderType === "agent" && data.conversationId === conversationId) {
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
      senderType: "visitor"
    });
  }
}
