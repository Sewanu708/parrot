import "dotenv/config";
import { env } from "@parrot/db/src/env";
import { createServer } from "./express/server";
import { authRoutes } from "./modules/auth/routes";

const server = createServer({
  port: Number(env.PORT),
  enableCors: true,
});

authRoutes.forEach((route) => server.addHandler(route));

server.startServer();
