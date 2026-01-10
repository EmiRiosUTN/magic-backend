import { z } from 'zod';

export const setLanguageSchema = z.object({
    body: z.object({
        language: z.enum(['ES', 'EN'], {
            errorMap: () => ({ message: 'Language must be ES or EN' }),
        }),
    }),
});
