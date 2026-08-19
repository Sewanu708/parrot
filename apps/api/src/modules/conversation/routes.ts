import expressHandler from "../../express/handler";
import { ConversationController } from "./controller";
import {
  VisitorConversationSchema,
  SendAgentMessageSchema,
  IdentifyVisitorSchema,
} from "@parrot/sdk";
import { validateRequest } from "../../shared/middleware/validate";
import { requireAuth } from "../../shared/middleware/auth";
import { requireTenant } from "../../shared/middleware/tenant";
import requestPermission from "../../shared/middleware/permissions";
import { PERMISSIONS } from "../../express/constant";
import {
  authenticatedLimiter,
  unauthenticatedLimiter,
} from "../../shared/middleware/limiter";

export const identifyVisitorRoute = expressHandler({
  method: "post",
  path: "/widget/identify",
  middlewares: [
    unauthenticatedLimiter,
    validateRequest({ body: IdentifyVisitorSchema }),
  ],
  handler: ConversationController.identifyVisitor.bind(ConversationController),
});

export const getWidgetConversationsRoute = expressHandler({
  method: "get",
  path: "/widget/conversations",
  middlewares: [unauthenticatedLimiter],
  handler: ConversationController.getWidgetConversations.bind(
    ConversationController,
  ),
});

export const sendVisitorMessageRoute = expressHandler({
  method: "post",
  path: "/widget/messages",
  middlewares: [
    unauthenticatedLimiter,
    validateRequest({ body: VisitorConversationSchema }),
  ],
  handler: ConversationController.sendVisitorMessage.bind(
    ConversationController,
  ),
});

export const sendAgentMessageRoute = expressHandler({
  method: "post",
  path: "/conversations/messages",
  middlewares: [
    requireAuth,
    authenticatedLimiter,
    requireTenant,
    requestPermission(PERMISSIONS.CONVERSATIONS_WRITE),
    validateRequest({ body: SendAgentMessageSchema }),
  ],
  handler: ConversationController.sendAgentMessage.bind(ConversationController),
});

export const getConversationMessagesRoute = expressHandler({
  method: "get",
  path: "/conversations/:conversationId/messages",
  middlewares: [
    requireAuth,
    requireTenant,
    authenticatedLimiter,
    requestPermission(PERMISSIONS.CONVERSATIONS_READ),
  ],
  handler: ConversationController.getMessages.bind(ConversationController),
});

export const getConversationsRoute = expressHandler({
  method: "get",
  path: "/conversations",
  middlewares: [
    requireAuth,
    authenticatedLimiter,
    requireTenant,
    requestPermission(PERMISSIONS.CONVERSATIONS_READ),
  ],
  handler: ConversationController.getConversations.bind(ConversationController),
});

export const getVisitorMessagesRoute = expressHandler({
  method: "get",
  path: "/widget/conversations/:conversationId/messages",
  middlewares: [unauthenticatedLimiter],
  handler: ConversationController.getMessages.bind(ConversationController),
});

export const conversationRoutes = [
  identifyVisitorRoute,
  getWidgetConversationsRoute,
  sendVisitorMessageRoute,
  sendAgentMessageRoute,
  getConversationMessagesRoute,
  getConversationsRoute,
  getVisitorMessagesRoute,
];

