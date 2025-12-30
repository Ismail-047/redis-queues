import { EmailJob } from "./email.js";
import { emailQueue } from "./email.queue.js";

class EmailService {

    // CORE METHOD TO SEND EMAILS TO BULLMQ QUEUE.
    static async sendEmail(data: EmailJob) {
        await emailQueue.add("send", data);
    }

    static async sendVerificationEmail(to: string, code: string) {
        await this.sendEmail({
            to,
            subject: "Verify your email",
            html: `<p>Your verification code is: <strong>${code}</strong></p>`,
        });
    }

    static async sendPasswordResetEmail(to: string, token: string) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        await this.sendEmail({
            to,
            subject: "Reset your password",
            html: `<p>Click the link below to reset your password: <a href="${resetLink}">Click here</a></p>`,
        });
    }
}

export { EmailService }