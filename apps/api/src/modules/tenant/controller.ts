import { RequestComponents, HandlerResult } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import { tenantRepository } from "./repository";
import type { CreateTenantDto, UpdateTenantDto } from "@parrot/sdk";
import { AuthRepository } from "../auth/repository";
import { Session, User } from "@parrot/db/src/schema";

export class TenantController {
  static async create(req: RequestComponents): Promise<HandlerResult> {
    const { user, session } = req.meta as { user: User; session: Session };
    const userId = user.id
    if (!userId) {
      appError("Unauthorized", ERROR_CODE.NOAUTHERR, { code: "SL07" });
    }

    const data = req.body as CreateTenantDto;

    try {
      const tenant = await tenantRepository.createTenantWithOwner(userId, data);

      void AuthRepository.updateActiveSession(session.id, tenant.id);
      return {
        status: 201,
        message: "Tenant created successfully",
        data: tenant,
      };
    } catch (error) {
      appError("Failed to create tenant", ERROR_CODE.APPERR, {
        context: { error },
      });
    }
  }

  static async get(req: RequestComponents): Promise<HandlerResult> {
    const tenantId = req.params.tenantId;
    const userId = req.meta.user?.id;

    if (!userId) {
      appError("Unauthorized", ERROR_CODE.NOAUTHERR, { code: "SL07" });
    }

    // Optional: check if user is member of this tenant, or if they have permission to view it
    const isMember = await tenantRepository.isUserMemberOfTenant(
      userId,
      tenantId,
    );
    if (!isMember) {
      appError("Forbidden", ERROR_CODE.PERMERR, { code: "SL09" });
    }

    const tenant = await tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      appError("Tenant not found", ERROR_CODE.NOTFOUND, { code: "SL10" });
    }

    return {
      status: 200,
      data: tenant,
    };
  }

  static async update(req: RequestComponents): Promise<HandlerResult> {
    const tenantId = req.params.tenantId;
    const userId = req.meta.user?.id;
    const data = req.body as UpdateTenantDto;

    if (!userId) {
      appError("Unauthorized", ERROR_CODE.NOAUTHERR, { code: "SL07" });
    }

    const isMember = await tenantRepository.isUserMemberOfTenant(
      userId,
      tenantId,
    );
    if (!isMember) {
      appError("Forbidden", ERROR_CODE.PERMERR, { code: "SL09" });
    }

    const tenant = await tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      appError("Tenant not found", ERROR_CODE.NOTFOUND, { code: "SL10" });
    }

    const updatedTenant = await tenantRepository.updateTenant(tenantId, data);

    return {
      status: 200,
      message: "Tenant updated successfully",
      data: updatedTenant,
    };
  }
}
