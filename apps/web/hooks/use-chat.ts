import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import type { MessageDto, ConversationDto, SendAgentMessageInput } from "@parrot/sdk";
import { useSessionUser } from "./use-auth";

/** Query hook to fetch conversation message thread */
export function useMessages(conversationId: string | null) {
  return useQuery<MessageDto[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await parrotClient.conversation.getMessages(conversationId);
      return res.data ?? [];
    },
    enabled: Boolean(conversationId),
  });
}

/** Query hook to fetch conversations for active workspace */
export function useConversations() {
  return useQuery<ConversationDto[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      // Prepared for API list endpoint resolution
      return [];
    },
  });
}

/** Mutation hook to send an agent reply with optimistic UI updates */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const  user  = useSessionUser();

  return useMutation({
    mutationFn: async (input:SendAgentMessageInput) => {
      const res = await parrotClient.conversation.sendMessage(input);
      if (!res.data) {
        throw new Error("Failed to send message. Please try again.");
      }
      return res.data;
    },

    onMutate: async ({ conversationId, body }) => {
      if (!conversationId) return;
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previousMessages = queryClient.getQueryData<MessageDto[]>(["messages", conversationId]) || [];

      const optimisticMessage: MessageDto = {
        id:  crypto.randomUUID(),
        conversationId,
        agentId: user?.id ?? null,
        senderType: "agent",
        body: body || "",
        status: "sent",
        createdAt: new Date().toISOString(),
        visitorId: null,
        messageType: "text",
        metadata: {},
      };

      queryClient.setQueryData<MessageDto[]>(["messages", conversationId], (old) => [
        ...(old || []),
        optimisticMessage,
      ]);

      return { previousMessages };
    },

    onError: (_err, { conversationId }, context) => {
      if (context?.previousMessages && conversationId) {
        queryClient.setQueryData(["messages", conversationId], context.previousMessages);
      }
    },

    onSettled: (_, __, { conversationId }) => {
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
