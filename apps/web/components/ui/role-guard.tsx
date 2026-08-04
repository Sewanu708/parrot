"use client";

import { useSessionUser } from "@/hooks/use-auth";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode; 
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const user = useSessionUser();
  const activeTenant = user?.tenants.find(t => t.id === user.activeTenantId);
  const currentRole = activeTenant?.role || "Agent"; 

  // Wait until user is fully loaded, or assume fallback if missing
  if (!user) return <>{fallback}</>;

  if (!allowedRoles.includes(currentRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
