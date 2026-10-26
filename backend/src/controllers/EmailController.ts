import { Request, Response } from 'express';
import { EmailService } from '../services/EmailService';
import { prisma } from '../config/prisma';
import { OutlookService } from '../services/OutlookService';

export class EmailController {
    private static emailService = new EmailService();
    private static outlookService = new OutlookService();

    public static sendAcceptanceEmail = async (req: Request, res: Response): Promise<void> => {
        try {
            const { applicationId } = req.params;
            if (!applicationId) {
                res.status(400).json({ error: 'applicationId is required in the URL.' });
                return;
            }

            await EmailController.emailService.sendAcceptanceEmail(applicationId as string);
            res.status(200).json({ message: `Acceptance email sent for application ${applicationId}` });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to send email.' });
        }
    };

    public static sendRejectionEmail = async (req: Request, res: Response): Promise<void> => {
        try {
            const { applicationId } = req.params;
            if (!applicationId) {
                res.status(400).json({ error: 'applicationId is required in the URL.' });
                return;
            }

            await EmailController.emailService.sendRejectionEmail(applicationId as string);
            res.status(200).json({ message: `Rejection email sent for application ${applicationId}` });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to send email.' });
        }
    };

    public static sendPasswordLink = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ error: 'Email address is required in body.' });
                return;
            }
            await EmailController.emailService.sendPasswordSetupLink(email);
            res.status(200).json({ message: `Password setup link sent to ${email}` });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to send link.' });
        }
    };

    public static sendForgotPasswordOTP = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ error: 'Email address is required in body.' });
                return;
            }

            await EmailController.emailService.sendForgotPasswordOTP(email);

            res.status(200).json({ message: `If that email is in our system, an OTP has been sent.` });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to send OTP.' });
        }
    }

    public static getNotifications = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });

            res.status(200).json(notifications);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to fetch notifications.' });
        }
    };

    public static markAllNotificationsRead = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });

            res.status(200).json({ message: 'All notifications marked as read.' });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to update notifications.' });
        }
    };

    public static markNotificationRead = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user?.id;
            const notificationId = req.params.id;

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const notification = await prisma.notification.updateMany({
                where: { id: notificationId as string, userId },
                data: { isRead: true }
            });

            if (notification.count === 0) {
                res.status(404).json({ error: 'Notification not found or access denied.' });
                return;
            }

            res.status(200).json({ message: 'Notification marked as read.' });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to update notification.' });
        }
    };


    public static sendContactMessage = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, email, message } = req.body;
            if (!name || !email || !message) {
                res.status(400).json({ error: 'Name, email, and message are required.' });
                return;
            }

            // Sends the public contact form message to the main ICEP admin address
            const adminEmail = process.env.OUTLOOK_USER || 'admin@icep.local';
            const subject = `New Contact Form Submission from ${name}`;
            const body = `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong><br/>${message}</p>`;

            await EmailController.outlookService.sendEmail(adminEmail, subject, body);
            res.status(200).json({ message: "Contact message sent successfully" });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to send contact message.' });
        }
    };

    public static getEmailTemplates = async (req: Request, res: Response): Promise<void> => {
        try {
            const templates = await prisma.emailTemplate.findMany({
                orderBy: { key: 'asc' }
            });
            res.status(200).json(templates);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to fetch templates.' });
        }
    };

    public static getEmailTemplate = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const template = await prisma.emailTemplate.findUnique({
                where: { id: id as string }
            });

            if (!template) {
                res.status(404).json({ error: 'Template not found.' });
                return;
            }

            res.status(200).json(template);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to fetch template.' });
        }
    };

    public static updateEmailTemplate = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { subject, body } = req.body;
            const userId = (req as any).user?.id;

            if (!subject || !body) {
                res.status(400).json({ error: 'Subject and body are required to update a template.' });
                return;
            }

            const updatedTemplate = await prisma.emailTemplate.update({
                where: { id: id as string },
                data: {
                    subject,
                    body,
                    updatedById: userId
                }
            });

            res.status(200).json(updatedTemplate);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to update template.' });
        }
    };

    public static getEmailLogs = async (req: Request, res: Response): Promise<void> => {
        try {
            const logs = await prisma.emailLog.findMany({
                include: {
                    template: { select: { key: true } },
                    user: { select: { fullName: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            res.status(200).json(logs);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to fetch email logs.' });
        }
    };


}