import z from "zod";

export const VisitorConversationSchema = z.object({
  propertyId: z.uuid(),
  clientVisitorId: z.uuid(),
  conversationId: z.uuid().optional(),
  body: z.string(),
});

export type SendVisitorMessageInput = z.infer<typeof VisitorConversationSchema>;

export const SendAgentMessageSchema = z.object({
  body: z.string().min(1, "Message body cannot be empty"),
  conversationId: z.uuid(),
  propertyId: z.uuid(),
});

export type SendAgentMessageInput = z.infer<typeof SendAgentMessageSchema>;

export interface MessageDto {
  id: string;
  conversationId?: string;
  senderType: "agent" | "visitor" | "system";
  agentId: string | null;
  visitorId: string | null;
  messageType: string;
  body: string | null;
  status: "sent" | "delivered" | "read";
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  tenantId: string;
  visitorId: string;
  assignedAgentId: string | null;
  status: "open" | "assigned" | "closed";
  channel: "chat" | "email" | "sms";
  startedAt: string;
  closedAt: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResponse {
  conversationId: string;
  message: MessageDto;
}

export interface VisitorDto {
  id: string;
  propertyId: string;
  name: string | null;
  clientVisitorId: string | null;
  email: string | null;
  phone: string | null;
  metadata: Record<string, any>;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface ConversationWithVisitorDto {
  conversation: ConversationDto;
  visitor: VisitorDto;
}
