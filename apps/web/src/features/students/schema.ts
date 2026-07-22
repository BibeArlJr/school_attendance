import { z } from 'zod';

// class_id stays a plain string here (matching what the Select control
// actually holds) rather than z.coerce.number() — react-hook-form's
// generic form-values type must match the schema's input type exactly,
// and z.coerce/z.preprocess make the input type differ from the output
// type, which breaks that match. The string->number conversion happens
// at the API call boundary instead (see api/studentsApi.ts).
export const studentSchema = z.object({
  class_id: z.string().min(1, 'Select a class'),
  first_name: z.string().min(1, 'First name is required').max(255, 'Too long'),
  last_name: z.string().min(1, 'Last name is required').max(255, 'Too long'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  admission_date: z.string().min(1, 'Admission date is required'),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(255, 'Too long'),
  section: z.string().max(50, 'Too long').optional(),
  // 'none' is the Select sentinel for "no class teacher assigned" — Radix
  // Select doesn't allow an empty-string item value — mapped to null at
  // the API boundary (see api/studentsApi.ts).
  class_teacher_id: z.string().optional(),
});

export type ClassFormValues = z.infer<typeof classSchema>;
