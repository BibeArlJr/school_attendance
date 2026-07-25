import { z } from 'zod';

// class_id stays a plain string here (matching what the Select control
// actually holds) rather than z.coerce.number() — react-hook-form's
// generic form-values type must match the schema's input type exactly,
// and z.coerce/z.preprocess make the input type differ from the output
// type, which breaks that match. The string->number conversion happens
// at the API call boundary instead (see api/studentsApi.ts).
// roll_no/address/guardian_* only ever render in the Add flow (never
// Edit) — kept on this one shared schema anyway, rather than a second
// add-only schema, so react-hook-form's generic always matches this
// resolver's inferred type exactly (see the class_id comment above).
export const studentSchema = z
  .object({
    class_id: z.string().min(1, 'Select a class'),
    first_name: z.string().min(1, 'First name is required').max(255, 'Too long'),
    last_name: z.string().min(1, 'Last name is required').max(255, 'Too long'),
    dob: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['male', 'female', 'other']),
    admission_date: z.string().min(1, 'Admission date is required'),
    roll_no: z.string().max(50, 'Too long').optional(),
    address: z.string().max(500, 'Too long').optional(),
    guardian_name: z.string().max(255, 'Too long').optional(),
    guardian_phone: z.string().max(50, 'Too long').optional(),
  })
  .superRefine((data, ctx) => {
    const hasName = Boolean(data.guardian_name?.trim());
    const hasPhone = Boolean(data.guardian_phone?.trim());
    if (hasName && !hasPhone) {
      ctx.addIssue({
        code: 'custom',
        path: ['guardian_phone'],
        message: 'Phone is required when adding a guardian',
      });
    }
    if (hasPhone && !hasName) {
      ctx.addIssue({
        code: 'custom',
        path: ['guardian_name'],
        message: 'Name is required when adding a guardian',
      });
    }
  });

export type StudentFormValues = z.infer<typeof studentSchema>;

export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(255, 'Too long'),
  section: z.string().max(50, 'Too long').optional(),
  // Plain text, not an FK (Prompt 35 Part F) — class_teacher_id was a
  // broken reference once Teacher accounts stopped existing (Prompt 34).
  class_teacher_name: z.string().max(255, 'Too long').optional(),
});

export type ClassFormValues = z.infer<typeof classSchema>;
