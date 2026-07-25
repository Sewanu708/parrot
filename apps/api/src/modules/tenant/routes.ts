import expressHandler from "../../express/handler";
import { TenantController } from "./controller";
import { CreateTenantSchema, UpdateTenantSchema } from "@parrot/sdk";
import { validateRequest } from "../../shared/middleware/validate";
import { authenticatedLimiter } from "../../shared/middleware/limiter";
import { requireAuth } from "../../shared/middleware/auth"; // Assuming there is an auth middleware

export const createTenantRoute = expressHandler({
  method: "post",
  path: "/tenants",
  middlewares: [requireAuth, authenticatedLimiter, validateRequest({ body: CreateTenantSchema })],
  handler: TenantController.create.bind(TenantController),
});

export const getTenantRoute = expressHandler({
  method: "get",
  path: "/tenants/:tenantId",
  middlewares: [requireAuth, authenticatedLimiter],
  handler: TenantController.get.bind(TenantController),
});

export const updateTenantRoute = expressHandler({
  method: "patch",
  path: "/tenants/:tenantId",
  middlewares: [requireAuth, authenticatedLimiter, validateRequest({ body: UpdateTenantSchema })],
  handler: TenantController.update.bind(TenantController),
});

export const tenantRoutes = [
  createTenantRoute,
  getTenantRoute,
  updateTenantRoute,
];
