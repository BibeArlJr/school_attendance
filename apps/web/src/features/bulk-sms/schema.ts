import { z } from 'zod';

// Raw, as-typed input — BulkSmsPhoneNormalizer (server-side) is the
// actual source of truth for shape/validity; this only bounds length,
// same "loose" convention every other phone field in this app already
// uses (guardian_phone, chairman_phone).
export const bulkSmsContactSchema = z.object({
  name: z.string().max(255, 'Too long').optional(),
  phone: z.string().min(1, 'Phone is required').max(30, 'Too long'),
});

export type BulkSmsContactFormValues = z.infer<typeof bulkSmsContactSchema>;
