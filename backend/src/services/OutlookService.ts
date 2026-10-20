import { outlookTransporter } from '../config/outlook';
import dotenv from 'dotenv';

dotenv.config();

export class OutlookService {

    public async sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
        try {

            const rawFrom = (process.env.OUTLOOK_USER || '').trim();
            const emailMatch = rawFrom.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            const fromAddress = emailMatch ? emailMatch[1] : 'icep.dev.demo@outlook.com';

            await outlookTransporter.sendMail({
                from: fromAddress,
                to: to.trim(),
                subject,
                html: htmlBody
            });

            console.log(`Email successfully sent to ${to}`);
            return true;
        } catch (error) {
            console.error('OutlookService Error (sendEmail):', error);
            return false;
        }
    }


    public async sendTemplateEmail(...args: any[]): Promise<boolean> {
        const to = args[0] || 'test@example.com';

        let subject = 'ICEP Notification';
        let body = '';

        if (typeof args[1] === 'string') {
            subject = args[1];
            body = typeof args[2] === 'string' ? args[2] : '';
        } else if (typeof args[1] === 'object' && args[1] !== null) {
            subject = args[1].subject || subject;
            body = args[1].body || '';
        }

        return await this.sendEmail(to, subject, body);
    }

    public async verifyConnection(): Promise<boolean> {
        try {
            await outlookTransporter.verify();
            console.log(' SMTP connection verified successfully.');
            return true;
        } catch (error) {
            console.error(' SMTP connection verification failed:', error);
            return false;
        }
    }
}