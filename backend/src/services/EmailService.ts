import jwt from 'jsonwebtoken';
import { OutlookService } from './OutlookService';
import { prisma } from '../config/prisma';

export class EmailService {
    private outlookService: OutlookService;

    constructor() {
        this.outlookService = new OutlookService();
    }

    public async sendAcceptanceEmail(applicationId: string): Promise<void> {

        const application = await prisma.application.findUnique({
            where: { id: applicationId }
        });
        if (!application) throw new Error(`Application ${applicationId} not found.`);


        const template = await prisma.emailTemplate.findUnique({
            where: { key: 'APPLICATION_ACCEPTED' }
        });
        if (!template) throw new Error("Template 'APPLICATION_ACCEPTED' not found.");

        const token = jwt.sign(
            { userId: application.id, email: application.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '48h' }
        );
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const setupLink = `${frontendUrl}/set-password?token=${token}`;


        const subject = template.subject.split('{{fullName}}').join(application.fullName);
        const content = template.body
            .split('{{fullName}}').join(application.fullName)
            .split('{{passwordLink}}').join(setupLink);

        const htmlContent = content.split('\n').join('<br>');

        const sent = await this.outlookService.sendTemplateEmail(
            application.email,
            subject,
            `Welcome to ICEP!`,
            htmlContent,
            setupLink,
            'Create Your Password'
        );

        if (!sent) throw new Error(`Failed to send email to ${application.email}`);


        await prisma.emailLog.create({
            data: {
                templateId: template.id,
                toEmail: application.email,
                subject: subject,
                status: 'SENT',
                applicationId: application.id
            }
        });
    }

    public async sendRejectionEmail(applicationId: string): Promise<void> {
        const application = await prisma.application.findUnique({
            where: { id: applicationId }
        });
        if (!application) throw new Error(`Application ${applicationId} not found.`);

        const template = await prisma.emailTemplate.findUnique({
            where: { key: 'APPLICATION_REJECTED' }
        });
        if (!template) throw new Error("Template 'APPLICATION_REJECTED' not found.");

        const subject = template.subject.split('{{fullName}}').join(application.fullName);
        const content = template.body.split('{{fullName}}').join(application.fullName);
        const htmlContent = content.split('\n').join('<br>');

        const sent = await this.outlookService.sendTemplateEmail(
            application.email,
            subject,
            `Application Update`,
            htmlContent
        );

        if (!sent) throw new Error(`Failed to send email to ${application.email}`);

        await prisma.emailLog.create({
            data: {
                templateId: template.id,
                toEmail: application.email,
                subject: subject,
                status: 'SENT',
                applicationId: application.id
            }
        });
    }

    public async sendPasswordSetupLink(email: string): Promise<void> {
        const user = await prisma.user.findUnique({ where: { email } });
        const fullName = user ? user.fullName : "User";

        const template = await prisma.emailTemplate.findUnique({
            where: { key: 'PASSWORD_RESET' }
        });
        if (!template) throw new Error("Template 'PASSWORD_RESET' not found.");

        const token = jwt.sign(
            { email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const setupLink = `${frontendUrl}/set-password?token=${token}`;

        const subject = template.subject.split('{{fullName}}').join(fullName);
        const content = template.body
            .split('{{fullName}}').join(fullName)
            .split('{{passwordLink}}').join(setupLink);
        const htmlContent = content.split('\n').join('<br>');

        const sent = await this.outlookService.sendTemplateEmail(
            email, subject, `Set Up Your Password`, htmlContent, setupLink, 'Set Password'
        );

        if (!sent) throw new Error(`Failed to send link to ${email}`);

        await prisma.emailLog.create({
            data: {
                templateId: template.id,
                toEmail: email,
                subject: subject,
                status: 'SENT'
            }
        });
    }
}