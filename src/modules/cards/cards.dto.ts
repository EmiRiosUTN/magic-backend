import { z } from 'zod';

// Priority enum values
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Create Card Schema
export const createCardSchema = z.object({
    sectionId: z.string().uuid('Invalid section ID'),
    title: z.string().min(1, 'Card title is required').max(200),
    description: z.string().max(5000).optional(),
    priority: priorityEnum.optional(),
    dueDate: z.string().datetime().optional(),
});

// Update Card Schema
export const updateCardSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    priority: priorityEnum.optional(),
    dueDate: z.string().datetime().optional().nullable(),
});

// Move Card Schema (for drag & drop between sections)
export const moveCardSchema = z.object({
    targetSectionId: z.string().uuid('Invalid section ID'),
    newPosition: z.number().int().min(0),
});

// Reorder Cards Schema (within same section)
export const reorderCardsSchema = z.object({
    sectionId: z.string().uuid('Invalid section ID'),
    cards: z.array(
        z.object({
            id: z.string().uuid(),
            position: z.number().int().min(0),
        })
    ),
});

// Types
export type CreateCardDto = z.infer<typeof createCardSchema>;
export type UpdateCardDto = z.infer<typeof updateCardSchema>;
export type MoveCardDto = z.infer<typeof moveCardSchema>;
export type ReorderCardsDto = z.infer<typeof reorderCardsSchema>;
