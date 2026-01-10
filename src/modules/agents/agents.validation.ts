import { z } from 'zod';

export const createAgentSchema = z.object({
    body: z.object({
        categoryId: z.string().uuid('Invalid category ID'),
        nameEs: z.string().min(2, 'Spanish name is required'),
        nameEn: z.string().min(2, 'English name is required'),
        descriptionEs: z.string().optional(),
        descriptionEn: z.string().optional(),
        systemPrompt: z.string().min(10, 'System prompt is required'),
        aiProvider: z.enum(['OPENAI', 'GEMINI'], {
            errorMap: () => ({ message: 'AI provider must be OPENAI or GEMINI' }),
        }),
        modelName: z.string().min(2, 'Model name is required'),
    }),
});

export const updateAgentSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid agent ID'),
    }),
    body: z.object({
        categoryId: z.string().uuid().optional(),
        nameEs: z.string().min(2).optional(),
        nameEn: z.string().min(2).optional(),
        descriptionEs: z.string().optional(),
        descriptionEn: z.string().optional(),
        systemPrompt: z.string().min(10).optional(),
        aiProvider: z.enum(['OPENAI', 'GEMINI']).optional(),
        modelName: z.string().min(2).optional(),
        isActive: z.boolean().optional(),
    }),
});

export const getAgentsByCategorySchema = z.object({
    query: z.object({
        categoryId: z.string().uuid('Invalid category ID'),
    }),
});

export const deleteAgentSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid agent ID'),
    }),
});
