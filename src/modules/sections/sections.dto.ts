import { z } from 'zod';

// Create Section Schema
export const createSectionSchema = z.object({
    projectId: z.string().uuid('Invalid project ID'),
    name: z.string().min(1, 'Section name is required').max(100),
});

// Update Section Schema
export const updateSectionSchema = z.object({
    name: z.string().min(1).max(100),
});

// Reorder Sections Schema
export const reorderSectionsSchema = z.object({
    projectId: z.string().uuid('Invalid project ID'),
    sections: z.array(
        z.object({
            id: z.string().uuid(),
            position: z.number().int().min(0),
        })
    ),
});

// Types
export type CreateSectionDto = z.infer<typeof createSectionSchema>;
export type UpdateSectionDto = z.infer<typeof updateSectionSchema>;
export type ReorderSectionsDto = z.infer<typeof reorderSectionsSchema>;
