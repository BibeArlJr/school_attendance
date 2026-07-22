import { z } from 'zod';

export const teacherSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email').max(255, 'Too long'),
  designation: z.string().min(1, 'Designation is required').max(255, 'Too long'),
  qualification: z.string().max(255, 'Too long').optional(),
  joined_date: z.string().min(1, 'Joined date is required'),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;
