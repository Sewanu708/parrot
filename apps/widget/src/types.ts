import { WidgetPropertyConfigDto } from "@parrot/sdk";

export interface WidgetMessage {
  id?: string;
  senderType: "visitor" | "agent";
  body: string;
  createdAt: string;
}

export interface WidgetState {
  isOpen: boolean;
  isOnline: boolean;
  messages: WidgetMessage[];
  propertyConfig: WidgetPropertyConfigDto | null;
  propertyId: string | null;
  visitorId: string;
  conversationId: string | null;
  isTyping: boolean;
}
