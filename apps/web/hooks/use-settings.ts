import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parrotClient } from "@/lib/parrot";
import type { 
  UpdateBusinessHoursConfigDto, 
  CreateCannedResponseDto, 
  UpdateCannedResponseDto,
  UpdatePropertyDto,
  CreateCustomAttributeDto,
  UpdateCustomAttributeDto,
} from "@parrot/sdk";

// Business Hours Hooks
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
      queryClient.invalidateQueries({ queryKey: ["business-hours", propertyId] });
    },
  });
}

// Canned Responses Hooks
export function useCannedResponses() {
  return useQuery({
    queryKey: ["canned-responses"],
    queryFn: () => parrotClient.settings.getCannedResponses(),
  });
}

export function useCreateCannedResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCannedResponseDto) =>
      parrotClient.settings.createCannedResponse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canned-responses"] });
    },
  });
}

export function useUpdateCannedResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCannedResponseDto }) =>
      parrotClient.settings.updateCannedResponse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canned-responses"] });
    },
  });
}

export function useDeleteCannedResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => parrotClient.settings.deleteCannedResponse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canned-responses"] });
    },
  });
}

// Property Settings Hooks
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, data }: { propertyId: string; data: UpdatePropertyDto }) =>
      parrotClient.tenant.updateProperty(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

// Custom Attributes Hooks
export function useCustomAttributes() {
  return useQuery({
    queryKey: ["custom-attributes"],
    queryFn: () => parrotClient.settings.getCustomAttributes(),
  });
}

export function useCreateCustomAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomAttributeDto) =>
      parrotClient.settings.createCustomAttribute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-attributes"] });
    },
  });
}

export function useUpdateCustomAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomAttributeDto }) =>
      parrotClient.settings.updateCustomAttribute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-attributes"] });
    },
  });
}

export function useDeleteCustomAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => parrotClient.settings.deleteCustomAttribute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-attributes"] });
    },
  });
}

