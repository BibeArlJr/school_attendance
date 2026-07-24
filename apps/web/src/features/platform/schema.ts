import { z } from 'zod';

export const createSchoolSchema = z.object({
  school_code: z.string().min(1, 'School code is required').max(50, 'Too long'),
  name: z.string().min(1, 'School name is required').max(255, 'Too long'),
  contact_email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  contact_phone: z.string().max(50, 'Too long').optional(),
  admin_name: z.string().min(1, "Admin's name is required").max(255, 'Too long'),
  admin_email: z.string().min(1, "Admin's email is required").email('Enter a valid email'),
});

export type CreateSchoolFormValues = z.infer<typeof createSchoolSchema>;
