import { z } from 'zod';

export const createConversationSchema = z.object({
    body: z.object({
        agentId: z.string().uuid('Invalid agent ID'),
        title: z.string().optional(),
    }),
});

export const getConversationsSchema = z.object({
    query: z.object({
        agentId: z.string().uuid('Invalid agent ID').optional(),
    }),
});

export const deleteConversationSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid conversation ID'),
    }),
});

export const confirmCreateConversationSchema = z.object({
    body: z.object({
        agentId: z.string().uuid('Invalid agent ID'),
        title: z.string().optional(),
        confirmDelete: z.boolean(),
    }),
});
