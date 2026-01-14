import { Request, Response } from 'express';
import { reminderService } from '../../services/reminder.service';
import { z } from 'zod';

const createReminderSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    triggerAt: z.string().datetime(),
});

export class RemindersController {

    // Create new reminder
    async create(req: Request, res: Response) {
        try {
            const data = createReminderSchema.parse(req.body);
            const reminder = await reminderService.createReminder(req.user!.id, data);
            res.status(201).json(reminder);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: error.errors });
            } else {
                res.status(500).json({ error: 'Failed to create reminder' });
            }
        }
    }

    // Get all reminders
    async getAll(req: Request, res: Response) {
        try {
            const reminders = await reminderService.getAllReminders(req.user!.id);
            res.json(reminders);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch reminders' });
        }
    }

    // Delete reminder
    async delete(req: Request, res: Response) {
        try {
            await reminderService.deleteReminder(req.user!.id, req.params.id);
            res.json({ message: 'Reminder deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete reminder' });
        }
    }
}

export const remindersController = new RemindersController();
