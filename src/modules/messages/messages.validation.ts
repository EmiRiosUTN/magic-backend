import { z } from 'zod';

export const sendMessageSchema = z.object({
    params: z.object({
        conversationId: z.string().uuid('Invalid conversation ID'),
    }),
    body: z.object({
        content: z.string().min(1, 'Message content is required'),
    }),
});

export const getMessagesSchema = z.object({
    params: z.object({
        conversationId: z.string().uuid('Invalid conversation ID'),
    }),
    query: z.object({
        limit: z.string().optional(),
        offset: z.string().optional(),
    }),
});
