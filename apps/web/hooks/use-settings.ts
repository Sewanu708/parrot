import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import type { UpdateBusinessHoursConfigDto } from "@parrot/sdk";

export function useBusinessHours(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["business-hours", propertyId],
    queryFn: () => parrotClient.settings.getBusinessHours(propertyId!),
    enabled: !!propertyId,
  });
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, data }: { propertyId: string; data: UpdateBusinessHoursConfigDto }) => 
      parrotClient.settings.updateBusinessHours(propertyId, data),
    onSuccess: (_, { propertyId }) => {
      // Invalidate the cache so it refetches the fresh data
      queryClient.invalidateQueries({ queryKey: ["business-hours", propertyId] });
    },
  });
}
