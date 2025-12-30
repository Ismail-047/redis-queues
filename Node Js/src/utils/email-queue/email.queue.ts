import { Queue } from "bullmq";
import { redisClient } from "../../lib/redis.js";

export const emailQueue = new Queue("email", {
    connection: redisClient,
    defaultJobOptions: {
        attempts: 3, // RETRY 3 TIMES IF IT FAILS.
        backoff: {
            type: "exponential", // EXPONENTIAL BACKOFF - WAIT 5 SECONDS, THEN 10 SECONDS, THEN 20 SECONDS, ETC.
            delay: 5000,
        },
        removeOnComplete: true, // DELETE JOB FROM REDIS AFTER SUCCESS. KEEPS REDIS CLEAN.
        removeOnFail: {
            count: 100,  // KEEP LAST 100 FAILURES
            age: 86400, // FOR 24 HOURS
        }
    }
});