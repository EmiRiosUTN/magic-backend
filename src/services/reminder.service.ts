import { prisma } from '../server';

export class ReminderService {

    // Create a manual reminder
    async createReminder(userId: string, data: { title: string; description?: string; triggerAt: string }) {
        return prisma.reminder.create({
            data: {
                userId,
                title: data.title,
                description: data.description,
                triggerAt: new Date(data.triggerAt),
            },
        });
    }

    // Get pending reminders for a user (future)
    async getPendingReminders(userId: string) {
        return prisma.reminder.findMany({
            where: {
                userId,
                isSent: false,
                triggerAt: { gt: new Date() },
            },
            orderBy: { triggerAt: 'asc' },
        });
    }

    // Get all reminders (history)
    async getAllReminders(userId: string) {
        return prisma.reminder.findMany({
            where: { userId },
            orderBy: { triggerAt: 'desc' },
        });
    }

    // Delete a reminder
    async deleteReminder(userId: string, reminderId: string) {
        return prisma.reminder.deleteMany({
            where: {
                id: reminderId,
                userId, // Ensure ownership
            },
        });
    }

    // Mark as sent (internal)
    async markAsSent(reminderId: string) {
        return prisma.reminder.update({
            where: { id: reminderId },
            data: { isSent: true },
        });
    }
}

export const reminderService = new ReminderService();
