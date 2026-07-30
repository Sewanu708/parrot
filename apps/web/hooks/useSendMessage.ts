import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import type { ConversationWithVisitorDto } from "@parrot/sdk";

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
      queryClient.setQueryData(["messages", activeChat], (old: any) => {
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
        queryClient.setQueryData(["messages", context.activeChat], (old: any) => {
          if (!old?.data) return old;
          
          return {
            ...old,
            data: old.data.map((msg: any) => 
              // Replace the temporary message (matching body and optimistic flag) with the real one
              (msg.isOptimistic && msg.body === variables) ? data.data.message : msg
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
