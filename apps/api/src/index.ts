import "dotenv/config";
import { env } from "./shared/env";
import { createServer } from "./express/server";
import { authRoutes } from "./modules/auth/routes";
import { tenantRoutes } from "./modules/tenant/routes";
export const server = createServer({
  port: Number(env.PORT),
  enableCors: true,
});

authRoutes.forEach((route) => server.addHandler(route));
tenantRoutes.forEach((route) => server.addHandler(route));

if (process.env.NODE_ENV !== "test") {
  server.startServer();
}
