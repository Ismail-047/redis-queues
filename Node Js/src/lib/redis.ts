import Redis from "ioredis";

export const redisClient = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),

    maxRetriesPerRequest: null, // DISABLES AUTOMATIC RETRIES FOR INDIVIDUAL REDIS COMMANDS - REQUIRED FOR BULLMQ 

    // BULLMQ USES BLOCKING COMMANDS THAT WAIT FOR DATA.
    // IF IOREDIS RETRIES THESE COMMANDS, IT CAN CAUSE TIMEOUTS AND INTERFERE WITH BLOCKING BEHAVIOR.
    // THIS IS WHY WE DISABLE AUTOMATIC RETRIES FOR INDIVIDUAL REDIS COMMANDS.
});

redisClient.on("ready", () => {
    console.log("REDIS CONNECTED SUCCESSFULLY!");
});

redisClient.on("error", (error) => {
    console.error("REDIS CONNECTION FAILED:", error.message);
});