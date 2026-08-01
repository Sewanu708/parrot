import expressHandler from "../../express/handler";
import { SettingsController } from "./controller";
import { UpdateBusinessHoursConfigSchema } from "@parrot/sdk";
import { validateRequest } from "../../shared/middleware/validate";
import { authenticatedLimiter } from "../../shared/middleware/limiter";
import { requireAuth } from "../../shared/middleware/auth";
import { requireTenant } from "../../shared/middleware/tenant";
import requestPermission from "../../shared/middleware/permissions";
import { PERMISSIONS } from "../../express/constant";

const settingsMiddlewares = [
  requireAuth,
  requireTenant,
  authenticatedLimiter,
  requestPermission(PERMISSIONS.SETTINGS_MANAGE),
];

const readMiddlewares = [
  requireAuth,
  requireTenant,
  authenticatedLimiter,
];

export const getBusinessHoursRoute = expressHandler({
  method: "get",
  path: "/properties/:propertyId/business-hours",
  middlewares: readMiddlewares,
  handler: SettingsController.getBusinessHours.bind(SettingsController),
});

export const updateBusinessHoursRoute = expressHandler({
  method: "put",
  path: "/properties/:propertyId/business-hours",
  middlewares: [...settingsMiddlewares, validateRequest({ body: UpdateBusinessHoursConfigSchema })],
  handler: SettingsController.updateBusinessHours.bind(SettingsController),
});

export const settingsRoutes = [
  getBusinessHoursRoute,
  updateBusinessHoursRoute,
];
