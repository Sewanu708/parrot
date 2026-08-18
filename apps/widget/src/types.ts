import type {
  WidgetPropertyConfigDto,
  WidgetConversationPreviewDto,
  CustomAttributeValue,
} from "@parrot/sdk";

export interface WidgetMessage {
  id?: string;
  senderType: "visitor" | "agent" | "system";
  body: string;
  createdAt: string;
}

export type WidgetTab = "chat" | "messages" | "thread";

export interface UserContext {
  name?: string;
  email?: string;
  phone?: string;
  custom?: Record<string, CustomAttributeValue>;
}

export interface WidgetState {
  isOpen: boolean;
  isOnline: boolean;
  activeTab: WidgetTab;
  selectedConversationId: string | null;
  selectedConversationMessages: WidgetMessage[];
  currentChatMessages: WidgetMessage[];
  conversationsList: WidgetConversationPreviewDto[];
  propertyConfig: WidgetPropertyConfigDto | null;
  propertyId: string;
  visitorId: string;
  currentConversationId: string | null;
  userContext: UserContext | null;
  isTyping: boolean;
  isStandalone: boolean;
  isLoadingHistory: boolean;
}

