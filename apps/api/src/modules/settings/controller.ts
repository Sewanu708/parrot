import { RequestComponents, HandlerResult } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import { SettingsRepository } from "./repository";
import type { UpdateBusinessHoursConfigDto, CreateCannedResponseDto, UpdateCannedResponseDto } from "@parrot/sdk";
import { PERMISSIONS } from "../../express/constant";

export class SettingsController {
  static async getBusinessHours(req: RequestComponents): Promise<HandlerResult> {
    const propertyId = req.params.propertyId;
    if (!propertyId) appError("Property ID required", ERROR_CODE.INVLDDATA, { code: "SL01" });

    const config = await SettingsRepository.getBusinessHours(propertyId);
    return { status: 200, data: config };
  }

  static async updateBusinessHours(req: RequestComponents): Promise<HandlerResult> {
    const propertyId = req.params.propertyId;
    if (!propertyId) appError("Property ID required", ERROR_CODE.INVLDDATA, { code: "SL01" });

    const data = req.body as UpdateBusinessHoursConfigDto;
    const config = await SettingsRepository.updateBusinessHours(propertyId, data);
    
    return { status: 200, message: "Business hours updated", data: config };
  }

  static async getCannedResponses(req: RequestComponents): Promise<HandlerResult> {
    const tenantId = req.meta.tenant.id;
    const memberId = req.meta.member.id;

    const responses = await SettingsRepository.getCannedResponses(tenantId, memberId);
    return { status: 200, data: responses };
  }

  static async createCannedResponse(req: RequestComponents): Promise<HandlerResult> {
    const tenantId = req.meta.tenant.id;
    const memberId = req.meta.member.id;
    const roleId = req.meta.member.roleId;
    const data = req.body as CreateCannedResponseDto;

    if (data.visibility === "shared") {
      const hasPerm = await SettingsRepository.checkPermission(roleId, PERMISSIONS.CANNED_RESPONSES_MANAGE);
      if (!hasPerm) {
        appError("You don't have permission to create shared canned responses", ERROR_CODE.PERMERR, { code: "CR01" });
      }
    }

    const ownerId = data.visibility === "personal" ? memberId : null;
    const response = await SettingsRepository.createCannedResponse(tenantId, ownerId, data);
    
    return { status: 201, message: "Canned response created", data: response };
  }

  static async updateCannedResponse(req: RequestComponents): Promise<HandlerResult> {
    const tenantId = req.meta.tenant.id;
    const memberId = req.meta.member.id;
    const roleId = req.meta.member.roleId;
    const id = req.params.id;
    const data = req.body as UpdateCannedResponseDto;

    const existing = await SettingsRepository.getCannedResponseById(id);
    if (!existing || existing.tenantId !== tenantId) {
      appError("Canned response not found", ERROR_CODE.NOTFOUND, { code: "CR02" });
    }

    let hasManagePerm: boolean | null = null;
    const checkManagePerm = async () => {
      if (hasManagePerm === null) {
        hasManagePerm = await SettingsRepository.checkPermission(roleId, PERMISSIONS.CANNED_RESPONSES_MANAGE);
      }
      return hasManagePerm;
    };

    if (existing!.visibility === "shared" && !(await checkManagePerm())) {
      appError("You don't have permission to edit shared canned responses", ERROR_CODE.PERMERR, { code: "CR03" });
    }
    if (existing!.visibility === "personal" && existing!.ownerId !== memberId) {
      appError("You can only edit your own personal canned responses", ERROR_CODE.PERMERR, { code: "CR04" });
    }
    
    if (data.visibility === "shared" && existing!.visibility !== "shared" && !(await checkManagePerm())) {
      appError("You don't have permission to make responses shared", ERROR_CODE.PERMERR, { code: "CR05" });
    }

    let ownerId: string | null | undefined = undefined;
    if (data.visibility !== undefined) {
      ownerId = data.visibility === "shared" ? null : memberId;
    }

    const response = await SettingsRepository.updateCannedResponse(id, data, ownerId);
    return { status: 200, message: "Canned response updated", data: response };
  }

  static async deleteCannedResponse(req: RequestComponents): Promise<HandlerResult> {
    const tenantId = req.meta.tenant.id;
    const memberId = req.meta.member.id;
    const roleId = req.meta.member.roleId;
    const id = req.params.id;

    const existing = await SettingsRepository.getCannedResponseById(id);
    if (!existing || existing.tenantId !== tenantId) {
      appError("Canned response not found", ERROR_CODE.NOTFOUND, { code: "CR06" });
    }

    if (existing!.visibility === "shared") {
      const hasPerm = await SettingsRepository.checkPermission(roleId, PERMISSIONS.CANNED_RESPONSES_MANAGE);
      if (!hasPerm) {
        appError("You don't have permission to delete shared canned responses", ERROR_CODE.PERMERR, { code: "CR07" });
      }
    }
    if (existing!.visibility === "personal" && existing!.ownerId !== memberId) {
      appError("You can only delete your own personal canned responses", ERROR_CODE.PERMERR, { code: "CR08" });
    }

    await SettingsRepository.deleteCannedResponse(id);
    return { status: 200, message: "Canned response deleted", data: null };
  }
}
