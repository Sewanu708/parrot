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

export type CustomAttributeValue = string | number | boolean | null;

export const CustomAttributeValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export interface MessageDto {
  id: string;
  conversationId?: string;
  senderType: "agent" | "visitor" | "system";
  agentId: string | null;
  visitorId: string | null;
  messageType: string;
  body: string | null;
  status: "sent" | "delivered" | "read";
  metadata: Record<string, CustomAttributeValue>;
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
  metadata: Record<string, CustomAttributeValue>;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResponse {
  conversationId: string;
  message: MessageDto;
  token?: string;
}

export interface VisitorDto {
  id: string;
  propertyId: string;
  name: string | null;
  clientVisitorId: string | null;
  email: string | null;
  phone: string | null;
  metadata: Record<string, CustomAttributeValue>;
  firstSeenAt: string;
  lastSeenAt: string;
}

export const IdentifyVisitorSchema = z.object({
  propertyId: z.string().uuid(),
  clientVisitorId: z.string().uuid(),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  metadata: z.record(z.string(), CustomAttributeValueSchema).optional(),
});

export type IdentifyVisitorDto = z.infer<typeof IdentifyVisitorSchema>;


export const GetWidgetConversationsSchema = z.object({
  propertyId: z.uuid(),
  clientVisitorId: z.uuid(),
});

export type GetWidgetConversationsDto = z.infer<
  typeof GetWidgetConversationsSchema
>;

export interface WidgetConversationPreviewDto {
  id: string;
  status: "open" | "assigned" | "closed" | "pending";
  lastMessageAt: string;
  createdAt: string;
  lastMessage: {
    id: string;
    body: string | null;
    senderType: "agent" | "visitor" | "system";
    createdAt: string;
  } | null;
}

export interface ConversationWithVisitorDto {
  conversation: ConversationDto;
  visitor: VisitorDto;
}

