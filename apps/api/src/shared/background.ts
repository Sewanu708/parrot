import { Queue, Worker } from "bullmq";
import { getRedisInstance } from "./redis";
import { ConversationRepository } from "../modules/conversation/repository";
import { logger } from "../logger";

const queue = new Queue("new:message", {
  connection: getRedisInstance().redis,
});

const worker = new Worker(
  "new:message",
  async (job) => {
    const { conversationId } = job.data;
    const convRepo = new ConversationRepository();
    await convRepo.autoReply(conversationId);
  },
  {
    connection: getRedisInstance().redis,
  }
);

worker.on("failed", (Job, err) => {
  logger.error(`[Background Worker]: Job - ${Job?.id} failed , err - ${err}`);
});
export { queue };
