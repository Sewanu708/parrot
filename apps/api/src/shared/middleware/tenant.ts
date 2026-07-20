import { RequestComponents, HandlerResult, HandlerFunction } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import { db } from "@parrot/db/src/config";
import { sessions, tenants, tenantMembers } from "@parrot/db/src/schema";
import { eq, and } from "drizzle-orm";

export const requireTenant: HandlerFunction = async (req: RequestComponents): Promise<HandlerResult> => {
  const { user, session } = req.meta; // populated by requireAuth
  
  if (!user || !session) {
    appError("Authentication required before checking tenant", ERROR_CODE.NOAUTHERR, { code: "SL07" });
  }

  // 1. Get the requested tenant ID. 
  // We prefer the 'x-tenant-id' header if they are switching, otherwise fallback to the session's active one.
  const targetTenantId = req.headers["x-tenant-id"] || session.activeTenantId;

  if (!targetTenantId) {
    appError("No active tenant selected. Please select a workspace.", ERROR_CODE.PERMERR, { code: "SL09" });
  }

  // 2. Fetch the tenant
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, targetTenantId as string));
  if (!tenant) {
    appError("Workspace not found.", ERROR_CODE.NOTFOUND, { code: "SL10" });
  }

  // 3. Verify the user is actually a member of this tenant
  const [member] = await db
    .select()
    .from(tenantMembers)
    .where(
      and(
        eq(tenantMembers.tenantId, tenant.id),
        eq(tenantMembers.userId, user.id)
      )
    );

  if (!member) {
    appError("You do not have access to this workspace.", ERROR_CODE.PERMERR, { code: "SL11" });
  }

  // 4. Auto-update the session if the user explicitly switched tenants via the header
  if (session.activeTenantId !== tenant.id) {
    await db.update(sessions)
      .set({ activeTenantId: tenant.id })
      .where(eq(sessions.id, session.id));
  }

  // Inject tenant and member info into the request metadata
  return {
    augments: {
      meta: {
        ...req.meta,
        tenant,
        member
      }
    }
  };
};
