import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import type { MessageDto, ConversationDto, SendAgentMessageInput, ConversationWithVisitorDto } from "@parrot/sdk";
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

// /** Mutation hook to send an agent reply with optimistic UI updates */
// export function useSendMessage() {
//   const queryClient = useQueryClient();
//   const  user  = useSessionUser();

//   return useMutation({
//     mutationFn: async (input:SendAgentMessageInput) => {
//       const res = await parrotClient.conversation.sendMessage(input);
//       if (!res.data) {
//         throw new Error("Failed to send message. Please try again.");
//       }
//       return res.data;
//     },

//     onMutate: async ({ conversationId, body }) => {
//       if (!conversationId) return;
//       await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
//       const previousMessages = queryClient.getQueryData<MessageDto[]>(["messages", conversationId]) || [];

//       const optimisticMessage: MessageDto = {
//         id:  crypto.randomUUID(),
//         conversationId,
//         agentId: user?.id ?? null,
//         senderType: "agent",
//         body: body || "",
//         status: "sent",
//         createdAt: new Date().toISOString(),
//         visitorId: null,
//         messageType: "text",
//         metadata: {},
//       };

//       queryClient.setQueryData<MessageDto[]>(["messages", conversationId], (old) => [
//         ...(old || []),
//         optimisticMessage,
//       ]);

//       return { previousMessages };
//     },

//     onError: (_err, { conversationId }, context) => {
//       if (context?.previousMessages && conversationId) {
//         queryClient.setQueryData(["messages", conversationId], context.previousMessages);
//       }
//     },

//     onSettled: (_, __, { conversationId }) => {
//       if (conversationId) {
//         queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
//       }
//       queryClient.invalidateQueries({ queryKey: ["conversations"] });
//     },
//   });
// }


export type UIMessage = MessageDto & { isOptimistic?: boolean };

export function useSendMessage(
  activeChat: string | null,
  conversations: ConversationWithVisitorDto[],
  onDraftClear: () => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => {
      const conv = conversations.find((c) => c.conversation.id === activeChat);
      if (!conv) throw new Error("Conversation not found");

      return parrotClient.conversation.sendMessage({
        conversationId: activeChat!,
        propertyId: conv.visitor.propertyId,
        body,
      });
    },
    onMutate: async (body: string) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["messages", activeChat] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(["messages", activeChat]);

      // Optimistically update to the new value
      queryClient.setQueryData(["messages", activeChat], (old: { data: UIMessage[] } | undefined) => {
        if (!old?.data) return old;
        
        const optimisticMsg = {
          id: `temp-${Date.now()}`,
          conversationId: activeChat,
          senderType: "agent",
          body,
          createdAt: new Date().toISOString(),
          isOptimistic: true // Optional flag for UI
        };

        return {
          ...old,
          data: [...old.data, optimisticMsg]
        };
      });

      // Clear draft input immediately for snappy feel
      onDraftClear();

      // Return context with the snapshotted value
      return { previousMessages, activeChat };
    },
    onError: (err, body, context) => {
      // Rollback to the previous state on error
      if (context?.previousMessages && context.activeChat) {
        queryClient.setQueryData(["messages", context.activeChat], context.previousMessages);
      }
    },
    onSuccess: (data, variables, context) => {
      // The WebSocket will also push the new message, but we can instantly update the real ID here
      if (context?.activeChat && data?.data?.message) {
        queryClient.setQueryData(["messages", context.activeChat], (old: { data: UIMessage[] } | undefined) => {
          if (!old?.data) return old;
          
          return {
            ...old,
            data: old.data.map((msg: UIMessage) => 
              // Replace the temporary message (matching body and optimistic flag) with the real one
              (msg.isOptimistic && msg.body === variables) ? data?.data?.message : msg
            )
          };
        });
      }
    },
    onSettled: (data, error, variables, context) => {
      // Optional: Refetch in the background to guarantee absolute synchronization
      if (context?.activeChat) {
        // queryClient.invalidateQueries({ queryKey: ["messages", context.activeChat] });
      }
    },
  });
}
