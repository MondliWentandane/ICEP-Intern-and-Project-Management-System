import { outlookTransporter } from "../config/outlook";

export class OutlookService {
    public async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
        try {
            await outlookTransporter.sendMail({
                from: '"ICEP Management Team" <${process.env.OUTLOOK_USER}>',
                to,
                subject,
                html: body,
            });
            return true;
        } catch (error) {
            console.error('OutlookService Error (sendEmail):', error);
            return false;
        }
    }

    public async sendTemplateEmail(
        to: string,
        subject: string,
        title: string,
        content: string,
        actionUrl?: string,
        actionText?: string
    ): Promise<boolean> {
        const buttonHtml = actionUrl && actionText
            ? '<div style="margin-top: 24px;"><a href="' + actionUrl + '" style="background-color: #2563eb; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">' + actionText + '</a></div>'
            : '';

        const htmlTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #1e293b;">${title}</h2>
                <div style="color: #334155; line-height: 1.6;">
                    ${content}
                </div>
                ${buttonHtml}
                <hr style="margin-top: 32px; border: none; border-top: 1px solid #e2e8f0;" />
                <p style="font-size: 12px; color: #64748b;">ICEP Intern & Project Management System</p>
            </div>
        `;
        return await this.sendEmail(to, subject, htmlTemplate);
    }
}