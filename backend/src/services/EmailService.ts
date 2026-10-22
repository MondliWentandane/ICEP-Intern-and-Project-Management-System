import jwt from 'jsonwebtoken';
import { OutlookService } from './OutlookService';
import { prisma } from '../config/prisma';
import crypto from 'crypto';

/** Plain-text templates get line breaks; HTML templates are used as they are. */
const asHtml = (text: string) => (/<[a-z][\s\S]*>/i.test(text) ? text : text.split('\n').join('<br>'));
const escapeHtml = (text: string) =>
    text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

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
        const htmlContent = asHtml(template.body.split('{{fullName}}').join(application.fullName));

        // sendEmail(to, subject, html): sendTemplateEmail would have used 'Application Update' as the body.
        const sent = await this.outlookService.sendEmail(application.email, subject, htmlContent);
        await this.logEmail(template.id, application.email, subject, sent, application.id);
        if (!sent) throw new Error(`Failed to send email to ${application.email}`);
    }

    /** Interview invitation with the date, time and venue the WIL Handler chose (template INTERVIEW_INVITE). */
    public async sendInterviewInvite(applicationId: string): Promise<void> {
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { position: { include: { campus: true } } }
        });
        if (!application) throw new Error(`Application ${applicationId} not found.`);
        if (!application.interviewAt) throw new Error('This application has no interview date.');

        const template = await prisma.emailTemplate.findUnique({ where: { key: 'INTERVIEW_INVITE' } });
        if (!template) throw new Error("Template 'INTERVIEW_INVITE' not found.");

        const when = new Intl.DateTimeFormat('en-ZA', {
            dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Johannesburg'
        }).format(application.interviewAt);
        const vars: Record<string, string> = {
            fullName: application.fullName,
            position: application.position.title,
            campus: application.position.campus.name,
            reference: application.referenceCode,
            interviewDate: when,
            interviewVenue: application.interviewVenue || 'To be confirmed',
        };
        const fill = (text: string) => text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);

        const subject = fill(template.subject);
        let htmlContent = asHtml(fill(template.body));
        // Templates written before interviews had a date and venue don't mention them: add the details.
        if (!template.body.includes('{{interviewDate}}')) {
            const details =
                `<div style="margin: 20px 0; padding: 14px 16px; border-radius: 8px; background: #f5f6f8; color: #1a202c; font-size: 15px; line-height: 1.7;">` +
                `<strong>Date &amp; time:</strong> ${escapeHtml(vars.interviewDate)}<br>` +
                `<strong>Venue:</strong> ${escapeHtml(vars.interviewVenue)}<br>` +
                `<strong>Position:</strong> ${escapeHtml(vars.position)} (${escapeHtml(vars.campus)} campus)<br>` +
                `<strong>Reference:</strong> ${escapeHtml(vars.reference)}</div>`;
            // Before the closing line (the last paragraph) when there is one, otherwise at the end.
            const lastParagraph = htmlContent.lastIndexOf('<p');
            const at = lastParagraph > htmlContent.indexOf('<p') ? lastParagraph : htmlContent.lastIndexOf('</div>');
            htmlContent = at === -1 ? htmlContent + details : htmlContent.slice(0, at) + details + htmlContent.slice(at);
        }

        const sent = await this.outlookService.sendEmail(application.email, subject, htmlContent);
        await this.logEmail(template.id, application.email, subject, sent, application.id);
        if (!sent) throw new Error(`Failed to send email to ${application.email}`);
    }

    /** Records every send attempt (sent or failed) for the email log. */
    private async logEmail(templateId: string, toEmail: string, subject: string, sent: boolean, applicationId: string) {
        await prisma.emailLog.create({
            data: {
                templateId, toEmail, subject, applicationId,
                status: sent ? 'SENT' : 'FAILED',
                ...(sent ? { sentAt: new Date() } : { error: 'The email provider did not accept the message.' })
            }
        });
    }

    public async sendPasswordSetupLink(email: string): Promise<void> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error("User not found in the system.");
        }

        const rawToken = crypto.randomBytes(32).toString('hex');

        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.passwordToken.create({
            data: {
                userId: user.id,
                tokenHash: tokenHash,
                purpose: 'SET_PASSWORD',
                expiresAt: expiresAt
            }
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const actualResetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

        const template = await prisma.emailTemplate.findUnique({
            where: { key: 'PASSWORD_RESET' }
        });

        if (!template) {
            throw new Error("PASSWORD_RESET template not found.");
        }

        const finalHtmlBody = template.body.replace('{{resetLink}}', actualResetLink);

        const sent = await this.outlookService.sendTemplateEmail(
            email,
            template.subject,
            finalHtmlBody
        );
        if (!sent) throw new Error(`Failed to send the password setup email to ${email}.`);
    }
}