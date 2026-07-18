import { createServer } from "./express/server";

const server = createServer({
  port: Number(process.env.PORT),
  enableCors: true,
});


server.startServer()