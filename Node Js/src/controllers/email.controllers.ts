import type { Request, Response } from "express";
import { MailService } from "../utlis/email-queue/mail.service.js";

export const sendVerificationEmail = async (req: Request, res: Response) => {
    try {
        const { to, code } = req.body;
        await MailService.sendVerificationEmail(to, code);
        return res
            .status(200)
            .json({
                message: "Verification email sent",
                to,
                code,
            });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ error: "Failed to send verification email" });
    }
};

export const sendPasswordResetEmail = async (req: Request, res: Response) => {
    try {
        const { to, token } = req.body;
        await MailService.sendPasswordResetEmail(to, token);
        return res
            .status(200)
            .json({
                message: "Password reset email sent",
                to,
                token,
            });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ error: "Failed to send password reset email" });
    }
};