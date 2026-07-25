import { db } from "@parrot/db/src/config";
import {
  properties,
  visitors,
  conversations,
  messages,
} from "@parrot/db/src/schema";
import { eq, and } from "drizzle-orm";
import type {
  SendVisitorMessageInput,
  SendAgentMessageInput,
} from "@parrot/sdk";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";

export class ConversationRepository {
  /**
   * Visitor sends a message via widget
   */
  async createVisitorMessage(data: SendVisitorMessageInput) {
    return await db.transaction(async (tx) => {
      const [property] = await tx
        .select()
        .from(properties)
        .where(eq(properties.widgetKey, data.propertyId));

      if (!property) {
        appError("Property not found", ERROR_CODE.NOTFOUND, {
          code: "SL12",
        });
      }

      // 2. Find or create visitor
      let visitor;
      if (data.clientVisitorId) {
        const [existing] = await tx
          .select()
          .from(visitors)
          .where(
            and(
              eq(visitors.propertyId, property.id),
              eq(visitors.clientVisitorId, data.clientVisitorId),
            ),
          );
        visitor = existing;
      }

      if (!visitor) {
        const [newVisitor] = await tx
          .insert(visitors)
          .values({
            propertyId: property.id,
            clientVisitorId: data.clientVisitorId || null,
          })
          .returning();
        visitor = newVisitor;
      }

      // 3. Find or create conversation
      let conversation;
      if (data.conversationId) {
        const [existingConv] = await tx
          .select()
          .from(conversations)
          .where(eq(conversations.id, data.conversationId));
        conversation = existingConv;
      }

      if (!conversation) {
        const [newConv] = await tx
          .insert(conversations)
          .values({
            tenantId: property.tenantId,
            visitorId: visitor.id,
            status: "open",
            channel: "chat",
          })
          .returning();
        conversation = newConv;
      }

      // 4. Create the message
      const [newMessage] = await tx
        .insert(messages)
        .values({
          conversationId: conversation.id,
          senderType: "visitor",
          visitorId: visitor.id,
          body: data.body,
        })
        .returning();

      return {
        conversation,
        message: newMessage,
        tenantId: property.tenantId,
        visitorId: visitor.id,
      };
    });
  }

  /**
   * Agent sends a reply from dashboard
   */
  async createAgentMessage(agentId: string, data: SendAgentMessageInput) {
    return await db.transaction(async (tx) => {
      // 1. Find conversation to ensure it exists
      const [conversation] = await tx
        .select()
        .from(conversations)
        .where(eq(conversations.id, data.conversationId));

      if (!conversation) {
        appError("Conversation not found", ERROR_CODE.NOTFOUND, {
          code: "SL13",
        });
      }

      // 2. Create message from agent
      const [newMessage] = await tx
        .insert(messages)
        .values({
          conversationId: conversation.id,
          senderType: "agent",
          agentId,
          body: data.body,
        })
        .returning();

      return {
        conversation,
        message: newMessage,
        visitorId: conversation.visitorId,
        tenantId: conversation.tenantId,
      };
    });
  }

  /**
   * Get messages for a given conversation
   */
  async getConversationMessages(conversationId: string) {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }
}

export const conversationRepository = new ConversationRepository();
