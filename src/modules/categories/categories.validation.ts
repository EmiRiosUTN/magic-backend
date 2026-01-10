import { z } from 'zod';

export const createCategorySchema = z.object({
    body: z.object({
        nameEs: z.string().min(2, 'Spanish name is required'),
        nameEn: z.string().min(2, 'English name is required'),
        descriptionEs: z.string().optional(),
        descriptionEn: z.string().optional(),
        icon: z.string().optional(),
        displayOrder: z.number().int().optional(),
    }),
});

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid category ID'),
    }),
    body: z.object({
        nameEs: z.string().min(2).optional(),
        nameEn: z.string().min(2).optional(),
        descriptionEs: z.string().optional(),
        descriptionEn: z.string().optional(),
        icon: z.string().optional(),
        displayOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
    }),
});

export const deleteCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid category ID'),
    }),
});
