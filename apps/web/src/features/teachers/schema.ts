import { z } from 'zod';

export const teacherSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email').max(255, 'Too long'),
  // Add-only (Prompt 26) — role can't be changed after creation, so this
  // is never sent on update, only on create. Kept on this one shared
  // schema anyway (matching students/schema.ts's roll_no/guardian_*
  // precedent) so react-hook-form's generic always matches this
  // resolver's inferred type exactly.
  role: z.enum(['teacher', 'guard', 'admin']),
  designation: z.string().max(255, 'Too long').optional(),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;
