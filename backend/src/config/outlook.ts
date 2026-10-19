import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const outlookTransporter = nodemailer.createTransport({
    host: "smtp-relay.bravo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.OUTLOOK_SMTP_LOGIN,
        pass: process.env.OUTLOOK_SMTP_KEY,
    },
});

export const verifyOutlookConnection = async (): Promise<void> => {
    try {
        await outlookTransporter.verify();
        console.log(` Outlook Email Service connected (${process.env.OUTLOOK_USER})`);
    } catch (error) {
        console.error(' Outlook Email Service connection failed:', error);
    }
};
