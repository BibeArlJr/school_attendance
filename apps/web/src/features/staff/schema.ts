import { z } from 'zod';

// Mirrors StoreStaffRequest/UpdateStaffRequest exactly (backend rules)
// — only `name` required, everything else nullable free text. No
// class_id-style relation field here at all; staff has no class
// concept.
export const staffSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Too long'),
  mobile: z.string().max(50, 'Too long').optional(),
  dob_bs: z.string().max(20, 'Too long').optional(),
  address: z.string().max(255, 'Too long').optional(),
  citizenship_number: z.string().max(100, 'Too long').optional(),
  designation: z.string().max(255, 'Too long').optional(),
  rank: z.string().max(255, 'Too long').optional(),
  sheet_roll_no: z.string().max(100, 'Too long').optional(),
  level: z.string().max(255, 'Too long').optional(),
});

export type StaffFormValues = z.infer<typeof staffSchema>;
