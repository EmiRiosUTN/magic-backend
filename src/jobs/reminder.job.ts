import cron from 'node-cron';
import { prisma } from '../config/database';
import { emailService } from '../services/email.service';

export const startReminderJob = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        console.log('⏰ [REMINDER JOB] Checking for reminders...');

        try {
            const now = new Date();

            // 1. Process Task Deadlines with configurable reminder days
            const cardsWithReminders = await prisma.card.findMany({
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
                                        include: { settings: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            for (const card of cardsWithReminders) {
                if (!card.dueDate || card.reminderDaysBefore === null) continue;

                const dueDate = new Date(card.dueDate);
                const reminderDate = new Date(dueDate);
                reminderDate.setDate(reminderDate.getDate() - (card.reminderDaysBefore || 0));
                reminderDate.setHours(9, 0, 0, 0); // Set to 9 AM

                // Check if today is the reminder date
                const today = new Date();
                today.setHours(9, 0, 0, 0);

                if (today >= reminderDate && now < dueDate) {
                    const user = card.section.project.user;
                    const email = user.settings?.notificationEmail || user.email;

                    console.log(`📨 Sending task reminder for card ${card.id} to ${email}`);

                    const sent = await emailService.sendEmail(
                        email,
                        `⚠️ Tarea por vencer: ${card.title}`,
                        `
                        <h1>Recordatorio de Tarea</h1>
                        <p>Hola <strong>${user.fullName}</strong>,</p>
                        <p>La tarea "<strong>${card.title}</strong>" en el proyecto "<strong>${card.section.project.name}</strong>" vence pronto.</p>
                        <p><strong>Fecha de vencimiento:</strong> ${card.dueDate?.toLocaleString('es-ES')}</p>
                        <p>Prioridad: ${card.priority}</p>
                        ${card.description ? `<p><strong>Descripción:</strong> ${card.description}</p>` : ''}
                        <hr/>
                        <small>Recordatorio configurado para ${card.reminderDaysBefore} día(s) antes del vencimiento.</small>
                        `
                    );

                    if (sent) {
                        await prisma.card.update({
                            where: { id: card.id },
                            data: { reminderSent: true },
                        });
                    }
                }
            }

            // 2. Process Manual Reminders
            const remindersToTrigger = await prisma.reminder.findMany({
                where: {
                    triggerAt: {
                        lte: now,
                    },
                    isSent: false,
                },
                include: {
                    user: {
                        include: { settings: true }
                    }
                }
            });

            for (const reminder of remindersToTrigger) {
                const user = reminder.user;
                const email = user.settings?.notificationEmail || user.email;

                console.log(`📨 Sending manual reminder ${reminder.id} to ${email}`);

                const sent = await emailService.sendEmail(
                    email,
                    `🔔 Recordatorio: ${reminder.title}`,
                    `
                    <h1>${reminder.title}</h1>
                    <p>Hola <strong>${user.fullName}</strong>,</p>
                    <p>Te recordamos: ${reminder.description || 'Sin descripción'}</p>
                    <hr/>
                    <small>Recordatorio programado en MagicAI.</small>
                    `
                );

                if (sent) {
                    await prisma.reminder.update({
                        where: { id: reminder.id },
                        data: { isSent: true },
                    });
                }
            }

        } catch (error) {
            console.error('❌ Error in Reminder Job:', error);
        }
    });

    console.log('🚀 Reminder Job started (running every minute)');
};
