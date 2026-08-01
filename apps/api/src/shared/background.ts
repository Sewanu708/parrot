import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { ConversationRepository } from "../modules/conversation/repository";
import { logger } from "../logger";
import { env } from "./env";

const bullmqConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, });

const queue = new Queue("new-message", {
  connection: bullmqConnection,
});

const worker = new Worker(
  "new-message",
  async (job) => {
    const { conversationId } = job.data;
    const convRepo = new ConversationRepository();
    await convRepo.autoReply(conversationId);
  },
  { connection: bullmqConnection },
);

worker.on("failed", (Job, err) => {
  logger.error(`[Background Worker]: Job - ${Job?.id} failed , err - ${err}`);
});
export { queue };
