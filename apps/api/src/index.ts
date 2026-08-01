import "dotenv/config";
import { env } from "./shared/env";
import { createServer } from "./express/server";
import { authRoutes } from "./modules/auth/routes";
import { tenantRoutes } from "./modules/tenant/routes";
import { conversationRoutes } from "./modules/conversation/routes";
import { settingsRoutes } from "./modules/settings/routes";
import { wsGateway } from "./ws/gateway";
import { TenantRepository } from "./modules/tenant/repository";
import { logger } from "./logger";

export const server = createServer({
  port: Number(env.PORT),
  enableCors: true,
});

authRoutes.forEach((route) => server.addHandler(route));
tenantRoutes.forEach((route) => server.addHandler(route));
conversationRoutes.forEach((route) => server.addHandler(route));
settingsRoutes.forEach((route) => server.addHandler(route));

if (process.env.NODE_ENV !== "test") {
  TenantRepository.seedPermissions()
    .then(() => {
      const httpServer = server.startServer();
      wsGateway.init(httpServer);
      logger.info("Permissions synced and server started.");
    })
    .catch((e) => {
      logger.error({ err: e }, "Error seeding permissions");
      process.exit(1);
    });
}
