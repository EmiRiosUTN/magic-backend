import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export class RemindersService {
    /**
     * Check for cards that need reminders sent and send them
     */
    async processReminders(): Promise<void> {
        try {
            const now = new Date();

            // Find cards that:
            // 1. Have reminders enabled
            // 2. Have a due date
            // 3. Haven't had their reminder sent yet
            // 4. Are due within the reminder window
            const cards = await prisma.card.findMany({
                where: {
                    reminderEnabled: true,
                    reminderSent: false,
                    dueDate: {
                        not: null,
                    },
                },
                include: {
                    section: {
                        include: {
                            project: {
                                include: {
                                    user: {
                                        include: {
                                            settings: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            for (const card of cards) {
                if (!card.dueDate || card.reminderDaysBefore === null) continue;

                const dueDate = new Date(card.dueDate);
                const reminderDate = new Date(dueDate);
                reminderDate.setDate(reminderDate.getDate() - (card.reminderDaysBefore || 0));

                // Check if today is the reminder date (or past it)
                if (now >= reminderDate && now < dueDate) {
                    await this.sendReminderEmail(card);

                    // Mark reminder as sent
                    await prisma.card.update({
                        where: { id: card.id },
                        data: { reminderSent: true },
                    });
                }
            }
        } catch (error) {
            console.error('Error processing reminders:', error);
            throw error;
        }
    }

    /**
     * Send reminder email for a specific card
     */
    private async sendReminderEmail(card: any): Promise<void> {
        try {
            const user = card.section.project.user;
            const notificationEmail = user.settings?.notificationEmail || user.email;

            // Get email configuration
            const emailConfig = await prisma.emailConfig.findFirst({
                where: { isActive: true },
            });

            if (!emailConfig) {
                console.warn('No active email configuration found');
                return;
            }

            // Create transporter
            const transporter = nodemailer.createTransport({
                host: emailConfig.smtpHost,
                port: emailConfig.smtpPort,
                secure: emailConfig.smtpPort === 465,
                auth: {
                    user: emailConfig.smtpUser,
                    pass: emailConfig.smtpPassword,
                },
            });

            const dueDate = card.dueDate ? new Date(card.dueDate).toLocaleDateString('es-ES') : 'Sin fecha';
            const projectName = card.section.project.name;
            const sectionName = card.section.name;

            // Send email
            await transporter.sendMail({
                from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
                to: notificationEmail,
                subject: `Recordatorio: ${card.title}`,
                html: `
                    <h2>Recordatorio de Tarea</h2>
                    <p>Tienes una tarea próxima a vencer:</p>
                    <hr>
                    <h3>${card.title}</h3>
                    ${card.description ? `<p>${card.description}</p>` : ''}
                    <p><strong>Proyecto:</strong> ${projectName}</p>
                    <p><strong>Sección:</strong> ${sectionName}</p>
                    <p><strong>Fecha de vencimiento:</strong> ${dueDate}</p>
                    <p><strong>Prioridad:</strong> ${card.priority}</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        Este es un recordatorio automático. Has configurado recibir esta notificación 
                        ${card.reminderDaysBefore} día(s) antes de la fecha de vencimiento.
                    </p>
                `,
            });

            console.log(`Reminder sent for card ${card.id} to ${notificationEmail}`);
        } catch (error) {
            console.error(`Error sending reminder email for card ${card.id}:`, error);
            throw error;
        }
    }

    /**
     * Reset reminder sent flag when due date or reminder settings change
     */
    async resetReminderSent(cardId: string): Promise<void> {
        await prisma.card.update({
            where: { id: cardId },
            data: { reminderSent: false },
        });
    }
}
