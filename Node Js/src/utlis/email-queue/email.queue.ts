import { Queue } from "bullmq";
import { redisConnection } from "../../lib/redis.js";

export const emailQueue = new Queue("email", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: {
            count: 100,
        },
    },
});