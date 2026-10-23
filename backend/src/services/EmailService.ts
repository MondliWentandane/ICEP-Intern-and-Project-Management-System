import { OutlookService } from './OutlookService';
import { prisma } from '../config/prisma';
import crypto from 'crypto';
import { placementLetterService } from './PlacementLetterService';

/** Plain-text templates get line breaks; HTML templates are used as they are. */
const asHtml = (text: string) => (/<[a-z][\s\S]*>/i.test(text) ? text : text.split('\n').join('<br>'));
const escapeHtml = (text: string) =>
    text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export class EmailService {
    private outlookService: OutlookService;

    constructor() {
        this.outlookService = new OutlookService();
    }

    /**
     * "Welcome to ICEP" email for an accepted applicant, with a one-time link to set their password
     * (the same /reset-password flow as staff invites). Their intern account must already exist.
     */
    public async sendAcceptanceEmail(applicationId: string): Promise<void> {
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { intern: { select: { userId: true } } }
        });
        if (!application) throw new Error(`Application ${applicationId} not found.`);
        if (!application.intern) throw new Error('The intern account has not been created for this application.');

        const template = await prisma.emailTemplate.findUnique({
            where: { key: 'APPLICATION_ACCEPTED' }
        });
        if (!template) throw new Error("Template 'APPLICATION_ACCEPTED' not found.");

        const setupLink = await this.createPasswordSetupLink(application.intern.userId);
        const subject = template.subject.split('{{fullName}}').join(application.fullName);
        let htmlContent = asHtml(template.body
            .split('{{fullName}}').join(escapeHtml(application.fullName))
            .split('{{passwordLink}}').join(setupLink));

        // The WIL placement letter goes with it as a PDF. If it can't be built, the welcome email
        // (with the set-password link) still goes out; the letter stays available on Track application.
        let letter: { fileName: string; pdf: Buffer } | null = null;
        try {
            letter = await placementLetterService.generate(application.id);
        } catch (error) {
            console.error(`Placement letter could not be generated for application ${application.id}:`, error);
        }
        if (letter) {
            const note =
                `<p style="color: #555555; font-size: 16px; line-height: 1.5;">` +
                `Your <strong>WIL placement letter</strong> is attached. Please submit it to your institution's WIL / experiential learning office.</p>`;
            // Before the closing line (the last paragraph), like the interview details.
            const lastParagraph = htmlContent.lastIndexOf('<p');
            htmlContent = lastParagraph > htmlContent.indexOf('<p')
                ? htmlContent.slice(0, lastParagraph) + note + htmlContent.slice(lastParagraph)
                : htmlContent + note;
        }

        const sent = await this.outlookService.sendEmail(application.email, subject, htmlContent,
            letter ? [{ filename: letter.fileName, content: letter.pdf, contentType: 'application/pdf' }] : undefined);
        await this.logEmail(template.id, application.email, subject, sent, application.id);
        if (!sent) throw new Error(`Failed to send email to ${application.email}`);
    }

    /** One-time set-password link (valid 24 hours). Only a hash of the token is stored. */
    private async createPasswordSetupLink(userId: string): Promise<string> {
        const rawToken = crypto.randomBytes(32).toString('hex');
        await prisma.passwordToken.create({
            data: {
                userId,
                tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
                purpose: 'SET_PASSWORD',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return `${frontendUrl}/reset-password?token=${rawToken}`;
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

        const actualResetLink = await this.createPasswordSetupLink(user.id);

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