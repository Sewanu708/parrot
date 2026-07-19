import "dotenv/config";
import { createServer } from "./express/server";

import { authRoutes } from "./modules/auth/routes";

const server = createServer({
  port: process.env.PORT ? Number(process.env.PORT) : undefined,
  enableCors: true,
});

authRoutes.forEach((route) => server.addHandler(route));

server.startServer();
