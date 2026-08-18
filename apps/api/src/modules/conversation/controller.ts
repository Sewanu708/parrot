import { RequestComponents, HandlerResult } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import { conversationRepository } from "./repository";
import type {
  SendVisitorMessageInput,
  SendAgentMessageInput,
  IdentifyVisitorDto,
} from "@parrot/sdk";
import type { User } from "@parrot/db/src/schema";
import { wsGateway } from "../../ws/gateway";

export class ConversationController {
  /**
   * Identify and enrich a visitor with user context
   */
  static async identifyVisitor(req: RequestComponents): Promise<HandlerResult> {
    const data = req.body as IdentifyVisitorDto;

    try {
      const visitor = await conversationRepository.identifyVisitor(data);
      return {
        status: 200,
        message: "Visitor identified successfully",
        data: visitor,
      };
    } catch (error) {
      appError("Failed to identify visitor", ERROR_CODE.APPERR, {
        code: "SL14",
        cause: error,
      });
    }
  }

  /**
   * Get past conversations list for a widget visitor
   */
  static async getWidgetConversations(
    req: RequestComponents,
  ): Promise<HandlerResult> {
    const propertyId = req.query.propertyId as string;
    const clientVisitorId = req.query.clientVisitorId as string;

    if (!propertyId || !clientVisitorId) {
      appError(
        "Property ID and Client Visitor ID are required",
        ERROR_CODE.INVLDDATA,
        { code: "SL01" },
      );
    }

    try {
      const list = await conversationRepository.getWidgetConversations(
        propertyId,
        clientVisitorId,
      );
      return {
        status: 200,
        data: list,
      };
    } catch (error) {
      appError("Failed to fetch widget conversations", ERROR_CODE.APPERR, {
        code: "SL00",
        cause: error,
      });
    }
  }

  /**
   * Visitor sends a message from the embeddable widget
   */
  static async sendVisitorMessage(
    req: RequestComponents,
  ): Promise<HandlerResult> {
    const data = req.body as SendVisitorMessageInput;

    try {
      const result = await conversationRepository.createVisitorMessage(data);

      // Real-time notification to online tenant agents via WS
      wsGateway.broadcastToTenant(result.tenantId, {
        event: "message:new",
        data: {
          id: result.message.id,
          conversationId: result.conversation.id,
          tenantId: result.tenantId,
          senderType: "visitor",
          body: result.message.body,
          createdAt: result.message.createdAt,
        },
      });

      return {
        status: 201,
        message: "Message sent successfully",
        data: {
          conversationId: result.conversation.id,
          message: result.message,
        },
      };
    } catch (error) {
      appError("Failed to send message", ERROR_CODE.APPERR, {
        code: "SL14",
        cause: error,
      });
    }
  }


  /**
   * Agent sends a message from the web dashboard
   */
  static async sendAgentMessage(
    req: RequestComponents,
  ): Promise<HandlerResult> {
    const user = req.meta?.user as User | undefined;
    if (!user?.id) {
      appError("Unauthorized", ERROR_CODE.NOAUTHERR, { code: "SL07" });
    }

    const data = req.body as SendAgentMessageInput;

    try {
      const result = await conversationRepository.createAgentMessage(
        user.id,
        data,
      );
      // Real-time push back to the widget visitor via WS
      wsGateway.sendToVisitor(result.visitorId!, {
        event: "message:new",
        data: {
          id: result.message.id,
          conversationId: result.conversation.id,
          tenantId: result.conversation.tenantId,
          senderType: "agent",
          agentId: user.id,
          body: result.message.body,
          createdAt: result.message.createdAt,
        },
      });

      return {
        status: 201,
        message: "Reply sent successfully",
        data: {
          conversationId: result.conversation.id,
          message: result.message,
        },
      };
    } catch (error) {
      appError("Failed to send reply", ERROR_CODE.APPERR, {
        code: "SL14",
        cause: error,
      });
    }
  }

  /**
   * GET /api/v1/conversations/:conversationId/messages
   * Fetch conversation message history
   */
  static async getMessages(req: RequestComponents): Promise<HandlerResult> {
    const conversationId = req.params.conversationId;
    if (!conversationId) {
      appError("Conversation ID is required", ERROR_CODE.INVLDDATA, {
        code: "SL01",
      });
    }

    try {
      const messagesList =
        await conversationRepository.getConversationMessages(conversationId);

      return {
        status: 200,
        data: messagesList,
      };
    } catch (error) {
      appError("Failed to fetch messages", ERROR_CODE.APPERR, {
        code: "SL00",
        cause: error,
      });
    }
  }

  /**
   * GET /api/v1/conversations
   * Fetch all conversations for the tenant
   */
  static async getConversations(req: RequestComponents): Promise<HandlerResult> {
    const tenantId = req.meta?.tenant?.id;
    if (!tenantId) {
      appError("Tenant ID is required", ERROR_CODE.INVLDDATA, { code: "SL01" });
    }

    try {
      const conversationsList =
        await conversationRepository.getTenantConversations(tenantId);

      return {
        status: 200,
        data: conversationsList,
      };
    } catch (error) {
      appError("Failed to fetch conversations", ERROR_CODE.APPERR, {
        code: "SL00",
        cause: error,
      });
    }
  }
}
