import expressHandler from "../../express/handler";
import { ConversationController } from "./controller";
import { VisitorConversationSchema, SendAgentMessageSchema } from "@parrot/sdk";
import { validateRequest } from "../../shared/middleware/validate";
import { requireAuth } from "../../shared/middleware/auth";
import { requireTenant } from "../../shared/middleware/tenant";

export const sendVisitorMessageRoute = expressHandler({
  method: "post",
  path: "/widget/messages",
  middlewares: [validateRequest({ body: VisitorConversationSchema })],
  handler: ConversationController.sendVisitorMessage.bind(
    ConversationController,
  ),
});

export const sendAgentMessageRoute = expressHandler({
  method: "post",
  path: "/conversations/messages",
  middlewares: [
    requireAuth,
    requireTenant,
    validateRequest({ body: SendAgentMessageSchema }),
  ],
  handler: ConversationController.sendAgentMessage.bind(ConversationController),
});

export const getConversationMessagesRoute = expressHandler({
  method: "get",
  path: "/conversations/:conversationId/messages",
  middlewares: [],
  handler: ConversationController.getMessages.bind(ConversationController),
});

export const conversationRoutes = [
  sendVisitorMessageRoute,
  sendAgentMessageRoute,
  getConversationMessagesRoute,
];
