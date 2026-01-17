import nodemailer from 'nodemailer';
import { prisma } from '../config/database';

export class EmailService {


    private async getTransporter() {
        // Always fetch fresh config to ensure we use the latest settings
        const config = await prisma.emailConfig.findFirst({
            where: { isActive: true },
        });

        if (!config) {
            console.warn('⚠️ No active Email Configuration found.');
            return null;
        }

        return nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: config.smtpUser,
                pass: config.smtpPassword,
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        try {
            const transporter = await this.getTransporter();
            const config = await prisma.emailConfig.findFirst({
                where: { isActive: true },
            });

            if (!transporter || !config) {
                console.error('❌ Cannot send email: Missing configuration');
                return false;
            }

            const info = await transporter.sendMail({
                from: `"${config.fromName}" <${config.fromEmail}>`,
                to,
                subject,
                html,
            });

            console.log(`📧 Email sent: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error('❌ Error sending email:', error);
            return false;
        }
    }
}

export const emailService = new EmailService();
