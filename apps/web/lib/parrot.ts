import { ParrotClient } from "@parrot/sdk";
import { getSession } from "next-auth/react";

export const parrotClient = new ParrotClient({
  getToken: async () => {
    if (typeof window !== "undefined") {
      const session = await getSession();
      return session?.user?.sessionToken;
    }
    return undefined;
  },
  getTenantId: async () => {
    if (typeof window !== "undefined") {
      const session = await getSession();
      return session?.user?.activeTenantId || undefined;
    }
    return undefined;
  }
});
