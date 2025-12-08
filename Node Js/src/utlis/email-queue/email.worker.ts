import { Worker, Job } from "bullmq";
import { Resend } from "resend";
import { redisConnection } from "../../lib/redis.js";
import type { EmailJob } from "./email.d";

// Environment variables are loaded in index.ts before this module is imported
if (!process.env.RESEND_API_KEY) {
    console.error("ERROR: RESEND_API_KEY is not set. Please check your .env file.");
    throw new Error("RESEND_API_KEY environment variable is required");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const emailWorker = new Worker<EmailJob>("email", // QUEUE NAME

    async (job: Job<EmailJob>) => {
        console.log("Job started");
        const { to, subject, html } = job.data;

        const { error } = await resend.emails.send({
            from: "Ismail Usman <onboarding@resend.dev>",
            to,
            subject,
            html,
        });

        if (error) {
            console.error(`Failed to send email: ${error.message}`);
            throw new Error(error.message); // TRIGGERS RETRY
        }
    }, {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
        max: 10,
        duration: 1000,
    },
});

// EVENT LISTENERS
// WHEN JOB IS COMPLETED
emailWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

// WHEN JOB IS FAILED
emailWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed after ${job?.attemptsMade} attempts: ${error.message}`);
});

export { emailWorker };