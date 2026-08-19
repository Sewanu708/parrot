import { db } from "@parrot/db/src/config";
import {
  properties,
  visitors,
  conversations,
  messages,
  tickets,
} from "@parrot/db/src/schema";
import { eq, and, desc } from "drizzle-orm";
import type {
  SendVisitorMessageInput,
  SendAgentMessageInput,
  IdentifyVisitorDto,
} from "@parrot/sdk";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import { queue } from "../../shared/background";
import { wsGateway } from "../../ws/gateway";
import { logger } from "../../logger";

export class ConversationRepository {
  /**
   * Identify and enrich a visitor with name, email, phone, and metadata
   */
  async identifyVisitor(data: IdentifyVisitorDto) {
    return await db.transaction(async (tx) => {
      const [property] = await tx
        .select()
        .from(properties)
        .where(eq(properties.id, data.propertyId));

      if (!property) {
        appError("Property not found", ERROR_CODE.NOTFOUND, {
          code: "SL12",
        });
      }

      const [existing] = await tx
        .select()
        .from(visitors)
        .where(
          and(
            eq(visitors.propertyId, property.id),
            eq(visitors.clientVisitorId, data.clientVisitorId),
          ),
        );

      const updatePayload: Partial<typeof visitors.$inferInsert> = {
        lastSeenAt: new Date(),
      };
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.email !== undefined) updatePayload.email = data.email;
      if (data.phone !== undefined) updatePayload.phone = data.phone;
      if (data.metadata !== undefined) {
        updatePayload.metadata = {
          ...((existing?.metadata as Record<string, any>) || {}),
          ...data.metadata,
        };
      }

      if (existing) {
        const [updated] = await tx
          .update(visitors)
          .set(updatePayload)
          .where(eq(visitors.id, existing.id))
          .returning();
        return updated;
      } else {
        const [created] = await tx
          .insert(visitors)
          .values({
            propertyId: property.id,
            clientVisitorId: data.clientVisitorId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            metadata: data.metadata || {},
          })
          .returning();
        return created;
      }
    });
  }

  /**
   * Get past conversations for a widget visitor with preview
   */
  async getWidgetConversations(propertyId: string, clientVisitorId: string) {
    const [visitor] = await db
      .select()
      .from(visitors)
      .where(
        and(
          eq(visitors.propertyId, propertyId),
          eq(visitors.clientVisitorId, clientVisitorId),
        ),
      );

    if (!visitor) {
      return [];
    }

    const convList = await db
      .select()
      .from(conversations)
      .where(eq(conversations.visitorId, visitor.id))
      .orderBy(desc(conversations.lastMessageAt));

    if (convList.length === 0) {
      return [];
    }

    const results = await Promise.all(
      convList.map(async (conv) => {
        const [lastMsg] = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        return {
          id: conv.id,
          status: conv.status,
          lastMessageAt: conv.lastMessageAt
            ? conv.lastMessageAt.toISOString()
            : conv.createdAt.toISOString(),
          createdAt: conv.createdAt.toISOString(),
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                body: lastMsg.body,
                senderType: lastMsg.senderType,
                createdAt: lastMsg.createdAt.toISOString(),
              }
            : null,
        };
      }),
    );

    return results;
  }

  /**
   * Visitor sends a message via widget
   */
  async createVisitorMessage(data: SendVisitorMessageInput) {
    return await db.transaction(async (tx) => {
      const [property] = await tx
        .select()
        .from(properties)
        .where(eq(properties.id, data.propertyId));

      if (!property) {
        appError("Property not found", ERROR_CODE.NOTFOUND, {
          code: "SL12",
        });
      }

      // Find or create visitor
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

      // Find or create conversation
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
            status: "pending",
            channel: "chat",
          })
          .returning();
        conversation = newConv;
      }

      if (conversation.status === "pending") {
        queue.add(
          "new-message",
          {
            conversationId: conversation.id,
          },
          {
            delay: 120_000,
            jobId: `pre-ticket-${conversation.id}`,
          },
        );
      }

      await tx
        .update(conversations)
        .set({
          status: "pending",
          lastMessageAt: new Date(),
        })
        .where(eq(conversations.id, conversation.id));

      // Create the message
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
        clientVisitorId: visitor.clientVisitorId,
      };
    });
  }

  /**
   * Agent sends a reply from dashboard
   */
  async createAgentMessage(agentId: string, data: SendAgentMessageInput) {
    return await db.transaction(async (tx) => {
      const [conversation] = await tx
        .select()
        .from(conversations)
        .where(eq(conversations.id, data.conversationId));

      if (!conversation) {
        appError("Conversation not found", ERROR_CODE.NOTFOUND, {
          code: "SL13",
        });
      }

      const [newMessage] = await tx
        .insert(messages)
        .values({
          conversationId: conversation.id,
          senderType: "agent",
          agentId,
          body: data.body,
        })
        .returning();

      const [existing] = await tx
        .select()
        .from(visitors)
        .where(eq(visitors.id, conversation.visitorId));

      await tx
        .update(conversations)
        .set({
          status: "open",
          lastMessageAt: new Date(),
        })
        .where(eq(conversations.id, conversation.id));

      queue.remove(`pre-ticket-${conversation.id}`);

      if (!existing) {
        appError("Visitor not found", ERROR_CODE.NOTFOUND, {
          code: "SL13",
        });
      }

      return {
        conversation,
        message: newMessage,
        visitorId: existing.clientVisitorId,
        tenantId: conversation.tenantId,
      };
    });
  }

  async autoReply(conversationId: string) {
    const result = await db.transaction(async (tx) => {
      const [conversation] = await tx
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.status, "pending"),
          ),
        );

      if (!conversation) return null;

      const [newMessage] = await tx
        .insert(messages)
        .values({
          conversationId: conversation.id,
          senderType: "system",
          body: "We're currently unavailable",
        })
        .returning();

      await tx.insert(tickets).values({
        tenantId: conversation.tenantId,
        status: "open",
        visitorId: conversation.visitorId,
      });

      const [visitor] = await tx
        .select()
        .from(visitors)
        .where(eq(visitors.id, conversation.visitorId));

      return { conversation, newMessage, visitor };
    });

    if (!result) return;
    const { conversation, newMessage, visitor } = result;

    logger.info(`[AUTOREPLY HANDLER -> SENDING] ${JSON.stringify(result)}`);
    if (visitor?.clientVisitorId) {
      wsGateway.sendToVisitor(visitor.clientVisitorId, {
        event: "message:new",
        data: {
          id: newMessage.id,
          conversationId: conversation.id,
          tenantId: conversation.tenantId,
          senderType: "system",
          messageType: newMessage.messageType,
          body: newMessage.body,
          createdAt: newMessage.createdAt,
        },
      });
    }
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

  /**
   * Get all conversations for a tenant (inbox)
   */
  async getTenantConversations(tenantId: string) {
    return await db
      .select({
        conversation: conversations,
        visitor: visitors,
      })
      .from(conversations)
      .innerJoin(visitors, eq(conversations.visitorId, visitors.id))
      .where(eq(conversations.tenantId, tenantId))
      .orderBy(desc(conversations.updatedAt));
  }
}

export const conversationRepository = new ConversationRepository();

