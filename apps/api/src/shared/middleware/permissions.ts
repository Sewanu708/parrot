import { RequestComponents, HandlerResult } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE, PermissionKey } from "../../express/constant";
import { db } from "@parrot/db/src/config";
import {
  permissions,
  rolePermissions,
  TenantMember,
} from "@parrot/db/src/schema";
import { eq, and } from "drizzle-orm";
import expressHandler from "../../express/handler";

const requestPermission = (requiredPermission: PermissionKey) =>
  expressHandler({
    path: "*",
    method: "get",
    handler: async (req: RequestComponents): Promise<HandlerResult> => {
      const { member } = req.meta as { member: TenantMember };

      if (!member || !member.roleId) {
        appError(
          "You must be assigned a role to perform this action.",
          ERROR_CODE.PERMERR,
          { code: "SL12" },
        );
      }

      const [permRecord] = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.name, requiredPermission));

      if (!permRecord) {
        appError(
          `System error: Permission '${requiredPermission}' is not registered.`,
          ERROR_CODE.PERMERR,
          { code: "SL13" },
        );
      }
      const [hasAccess] = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, member.roleId!),
            eq(rolePermissions.permissionId, permRecord.id),
          ),
        );

      if (!hasAccess) {
        appError(
          "You do not have the required permissions to perform this action.",
          ERROR_CODE.PERMERR,
          { code: "SL14" },
        );
      }

      return {};
    },
  });

export default requestPermission;
