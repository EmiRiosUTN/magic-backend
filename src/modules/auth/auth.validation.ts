import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
});

export const createUserSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        fullName: z.string().min(2, 'Full name must be at least 2 characters'),
        role: z.enum(['ADMIN', 'USER']).optional(),
        subscriptionTypeId: z.string().uuid().optional(),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string(),
        newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    }),
});
