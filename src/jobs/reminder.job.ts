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
                    // CRITICAL FIX: Mark as sent FIRST to prevent race conditions
                    // This ensures that if the cron runs again before email is sent,
                    // it won't try to send the email again
                    await prisma.card.update({
                        where: { id: card.id },
                        data: { reminderSent: true },
                    });

                    const user = card.section.project.user;
                    const email = user.settings?.notificationEmail || user.email;
                    const language = user.settings?.language || 'ES';
                    const isEnglish = language === 'EN';

                    console.log(`📨 Sending task reminder for card ${card.id} to ${email} in ${language}`);

                    // Bilingual email templates
                    const subject = isEnglish
                        ? `⚠️ Task Due Soon: ${card.title}`
                        : `⚠️ Tarea por vencer: ${card.title}`;

                    const emailBody = isEnglish
                        ? `
                        <h1>Task Reminder</h1>
                        <p>Hello <strong>${user.fullName}</strong>,</p>
                        <p>The task "<strong>${card.title}</strong>" in project "<strong>${card.section.project.name}</strong>" is due soon.</p>
                        <p><strong>Due date:</strong> ${card.dueDate?.toLocaleString('en-US')}</p>
                        <p>Priority: ${card.priority}</p>
                        ${card.description ? `<p><strong>Description:</strong> ${card.description}</p>` : ''}
                        <hr/>
                        <small>Reminder configured for ${card.reminderDaysBefore} day(s) before due date.</small>
                        `
                        : `
                        <h1>Recordatorio de Tarea</h1>
                        <p>Hola <strong>${user.fullName}</strong>,</p>
                        <p>La tarea "<strong>${card.title}</strong>" en el proyecto "<strong>${card.section.project.name}</strong>" vence pronto.</p>
                        <p><strong>Fecha de vencimiento:</strong> ${card.dueDate?.toLocaleString('es-ES')}</p>
                        <p>Prioridad: ${card.priority}</p>
                        ${card.description ? `<p><strong>Descripción:</strong> ${card.description}</p>` : ''}
                        <hr/>
                        <small>Recordatorio configurado para ${card.reminderDaysBefore} día(s) antes del vencimiento.</small>
                        `;

                    try {
                        await emailService.sendEmail(email, subject, emailBody);
                        console.log(`✅ Task reminder sent successfully for card ${card.id}`);
                    } catch (error) {
                        console.error(`❌ Failed to send task reminder for card ${card.id}:`, error);
                        // If email fails, revert the flag so it can be retried
                        await prisma.card.update({
                            where: { id: card.id },
                            data: { reminderSent: false },
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
                // CRITICAL FIX: Mark as sent FIRST to prevent race conditions
                await prisma.reminder.update({
                    where: { id: reminder.id },
                    data: { isSent: true },
                });

                const user = reminder.user;
                const email = user.settings?.notificationEmail || user.email;
                const language = user.settings?.language || 'ES';
                const isEnglish = language === 'EN';

                console.log(`📨 Sending manual reminder ${reminder.id} to ${email} in ${language}`);

                // Bilingual email templates
                const subject = isEnglish
                    ? `🔔 Reminder: ${reminder.title}`
                    : `🔔 Recordatorio: ${reminder.title}`;

                const emailBody = isEnglish
                    ? `
                    <h1>${reminder.title}</h1>
                    <p>Hello <strong>${user.fullName}</strong>,</p>
                    <p>This is your reminder: ${reminder.description || 'No description'}</p>
                    <hr/>
                    <small>Reminder scheduled in MagicAI.</small>
                    `
                    : `
                    <h1>${reminder.title}</h1>
                    <p>Hola <strong>${user.fullName}</strong>,</p>
                    <p>Te recordamos: ${reminder.description || 'Sin descripción'}</p>
                    <hr/>
                    <small>Recordatorio programado en MagicAI.</small>
                    `;

                try {
                    await emailService.sendEmail(email, subject, emailBody);
                    console.log(`✅ Manual reminder sent successfully: ${reminder.id}`);
                } catch (error) {
                    console.error(`❌ Failed to send manual reminder ${reminder.id}:`, error);
                    // If email fails, revert the flag so it can be retried
                    await prisma.reminder.update({
                        where: { id: reminder.id },
                        data: { isSent: false },
                    });
                }
            }

        } catch (error) {
            console.error('❌ Error in Reminder Job:', error);
        }
    });

    console.log('🚀 Reminder Job started (running every minute)');
};
