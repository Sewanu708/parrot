import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { parrotClient } from "@/lib/parrot";
import type { TenantDto, CreateTenantDto } from "@parrot/sdk";

export function useSessionUser() {
  const { data: session } = useSession();
  return session?.user;
}

/** Hook to fetch tenant workspace details */
export function useTenant(tenantId?: string) {
  return useQuery<TenantDto | null>({
    queryKey: ["tenant", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const res = await parrotClient.tenant.get(tenantId);
      return res.data ?? null;
    },
    enabled: Boolean(tenantId),
  });
}

/** Hook to create a new tenant workspace */
export function useCreateTenant() {
  return useMutation<TenantDto, Error, CreateTenantDto>({
    mutationFn: async (input) => {
      const res = await parrotClient.tenant.create(input);
      if (!res.data) {
        throw new Error(res.message || "Failed to create tenant");
      }
      return res.data;
    },
  });
}
