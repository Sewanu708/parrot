import { RequestComponents, HandlerResult } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import { SettingsRepository } from "./repository";
import type { UpdateBusinessHoursConfigDto } from "@parrot/sdk";

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
}
