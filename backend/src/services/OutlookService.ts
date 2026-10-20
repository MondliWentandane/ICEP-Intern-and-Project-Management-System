import { outlookTransporter } from '../config/outlook';
import dotenv from 'dotenv';

dotenv.config();

export class OutlookService {

    public async sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
        try {
            // Extracts a clean email address so Brevo never throws a 501 FROM syntax error
            const rawFrom = (process.env.OUTLOOK_USER || '').trim();
            const emailMatch = rawFrom.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            const fromAddress = emailMatch ? emailMatch[1] : 'icep.dev.demo@outlook.com';

            await outlookTransporter.sendMail({
                from: fromAddress,
                to: to.trim(),
                subject,
                html: htmlBody
            });

            console.log(`✅ Email successfully sent to ${to}`);
            return true;
        } catch (error) {
            console.error('OutlookService Error (sendEmail):', error);
            return false;
        }
    }

    public async sendTemplateEmail(
        to: string,
        subjectOrTemplate: string | { subject: string; body: string },
        bodyOrVariables?: string | Record<string, any>,
        variables: Record<string, any> = {}
    ): Promise<boolean> {
        let finalSubject = '';
        let finalBody = '';
        let templateVars = variables;

        if (typeof subjectOrTemplate === 'object' && subjectOrTemplate !== null) {
            finalSubject = subjectOrTemplate.subject;
            finalBody = subjectOrTemplate.body;
            if (typeof bodyOrVariables === 'object' && bodyOrVariables !== null) {
                templateVars = bodyOrVariables;
            }
        } else {
            finalSubject = subjectOrTemplate;
            finalBody = typeof bodyOrVariables === 'string' ? bodyOrVariables : '';
        }

        // Replace any {{placeholder}} variables in subject and body
        for (const [key, value] of Object.entries(templateVars)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            finalSubject = finalSubject.replace(regex, String(value ?? ''));
            finalBody = finalBody.replace(regex, String(value ?? ''));
        }

        return await this.sendEmail(to, finalSubject, finalBody);
    }

    public async verifyConnection(): Promise<boolean> {
        try {
            await outlookTransporter.verify();
            console.log('✅ SMTP connection verified successfully.');
            return true;
        } catch (error) {
            console.error('❌ SMTP connection verification failed:', error);
            return false;
        }
    }
}