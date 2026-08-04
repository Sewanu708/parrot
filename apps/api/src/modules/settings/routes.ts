import expressHandler from "../../express/handler";
import { SettingsController } from "./controller";
import { UpdateBusinessHoursConfigSchema, CreateCannedResponseSchema, UpdateCannedResponseSchema } from "@parrot/sdk";
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

// Note: We intentionally do NOT use the `requestPermission(PERMISSIONS.CANNED_RESPONSES_MANAGE)` 
// middleware for the Canned Responses routes below. This is because any standard agent 
// is allowed to create, update, and delete their own "personal" canned responses. 
// The check for the "shared" visibility permission is handled explicitly inside the controller 
// using `SettingsRepository.checkPermission`.

export const getCannedResponsesRoute = expressHandler({
  method: "get",
  path: "/settings/canned-responses",
  middlewares: readMiddlewares,
  handler: SettingsController.getCannedResponses.bind(SettingsController),
});

export const createCannedResponseRoute = expressHandler({
  method: "post",
  path: "/settings/canned-responses",
  middlewares: [...readMiddlewares, validateRequest({ body: CreateCannedResponseSchema })],
  handler: SettingsController.createCannedResponse.bind(SettingsController),
});

export const updateCannedResponseRoute = expressHandler({
  method: "patch",
  path: "/settings/canned-responses/:id",
  middlewares: [...readMiddlewares, validateRequest({ body: UpdateCannedResponseSchema })],
  handler: SettingsController.updateCannedResponse.bind(SettingsController),
});

export const deleteCannedResponseRoute = expressHandler({
  method: "delete",
  path: "/settings/canned-responses/:id",
  middlewares: readMiddlewares,
  handler: SettingsController.deleteCannedResponse.bind(SettingsController),
});

export const settingsRoutes = [
  getBusinessHoursRoute,
  updateBusinessHoursRoute,
  getCannedResponsesRoute,
  createCannedResponseRoute,
  updateCannedResponseRoute,
  deleteCannedResponseRoute,
];
