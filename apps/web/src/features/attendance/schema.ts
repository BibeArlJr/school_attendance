import { z } from 'zod';

export const manualCorrectionSchema = z.object({
  in_time: z.string().optional(),
  out_time: z.string().optional(),
  status: z.enum(['present', 'late', 'absent', 'half_day', 'out_without_in']).optional(),
  override_reason: z.string().min(1, 'A reason is required').max(1000, 'Too long'),
});

export type ManualCorrectionFormValues = z.infer<typeof manualCorrectionSchema>;
