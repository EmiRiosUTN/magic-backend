import cron from 'node-cron';
import { RemindersService } from './reminders.service';

const remindersService = new RemindersService();

/**
 * Schedule reminder checks to run daily at 9:00 AM
 */
export function initializeReminderScheduler(): void {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('Running scheduled reminder check...');
        try {
            await remindersService.processReminders();
            console.log('Reminder check completed successfully');
        } catch (error) {
            console.error('Error in scheduled reminder check:', error);
        }
    });

    console.log('Reminder scheduler initialized - will run daily at 9:00 AM');
}
