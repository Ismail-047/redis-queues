import { Worker, Job } from "bullmq";
import { Resend } from "resend";
import { redisClient } from "../../lib/redis.js";
import type { EmailJob } from "./email.d";

/*
    RESEND LIMITS:             FREE TIER                    PAID TIER (20$/month)
    ---------------------------------------------------------------------------------------------------
    API RATE LIMIT             2 REQUESTS PER SECOND        2 REQUESTS PER SECOND (DOESNT CHANGE)
    RESENDDAILY LIMIT          100 EMAILS/DAY               NO DAILY CAP
    RESENDMONTHLY LIMIT        3,000 EMAILS/MONTH           50,000 EMAILS/MONTH
    ---------------------------------------------------------------------------------------------------
*/

if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is required");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const emailWorker = new Worker<EmailJob>("email", // QUEUE NAME

    /*
    BULLMQ CALLS THE BELOW METHOD AUTOMATICALLY WHEN A JOB APPEARS IN THE QUEUE.
    - RETURNS NORMALLY -> JOB COMPLETE, REMOVED FROM QUEUE.
    - THROWS ERROR -> JOB FAILED, RETRY LOGIC KICKS IN (3 ATTEMPTS WITH EXPONENTIAL BACKOFF, AS CONFIGURED IN THE SERVICE).
*/
    async (job: Job<EmailJob>) => {
        const { to, subject, html } = job.data;

        const { error } = await resend.emails.send({
            from: `Auth App <auth@${process.env.RESEND_EMAIL_DOMAIN}>`,
            to,
            subject,
            html,
        });

        if (error) {
            console.error(`Failed to send email: ${error.message}`);
            throw new Error(error.message); // TRIGGERS RETRY
        }
        console.log(`Email sent successfully to ${to}`);
    },
    {
        connection: redisClient,
        concurrency: 2, // MAX 2 EMAIL JOBS CAN BE PROCESSED CONCURRENTLY (RESEND LIMIT)
        limiter: {
            max: 2, // MAX 2 PER SECOND
            duration: 1000, // 1 SECOND
        },
        lockDuration: 30000, // 30 SECONDS
    }
);

// WHEN JOB IS FAILED
emailWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed after ${job?.attemptsMade} attempts: ${error.message}`);
});

export { emailWorker };