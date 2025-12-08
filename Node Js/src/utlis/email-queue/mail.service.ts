import { emailQueue } from "./email.queue.js";

class MailService {
    static async sendVerificationEmail(to: string, code: string) {
        await emailQueue.add("send", {
            to,
            subject: "Verify your email",
            html: `
            <p>
                Your verification code is: 
                <strong>
                    ${code}
                </strong>
            </p>`,
        });
    }

    static async sendPasswordResetEmail(to: string, token: string) {
        const resetLink = `
            ${process.env.FRONTEND_URL}/reset-password?token=${token}
        `;
        await emailQueue.add("send", {
            to,
            subject: "Reset your password",
            html: `
            <p>
                Click the link below to reset your password: 
                <a href="${resetLink}">
                    Click here
                </a>
            </p>`,
        });
    }
}

export { MailService }