import { z } from 'zod';

export const schoolProfileSchema = z.object({
  name: z.string().min(1, 'School name is required').max(255, 'Too long'),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex color like #2563EB')
    .optional()
    .or(z.literal('')),
});

export type SchoolProfileFormValues = z.infer<typeof schoolProfileSchema>;

// Threshold fields stay plain strings here (matching what the number
// Input actually holds) rather than z.coerce.number() — react-hook-form's
// generic form-values type must match the schema's input type exactly,
// and z.coerce/z.preprocess make the input type differ from the output
// type, which breaks that match (see students/schema.ts's class_id for
// the same reasoning). The string->number conversion happens at the API
// call boundary instead (see AttendanceRulesSection's onSubmit).
const minutesField = z
  .string()
  .min(1, 'Required')
  .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 240, {
    message: 'Enter a whole number between 0 and 240',
  });

export const attendanceConfigSchema = z
  .object({
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().min(1, 'End time is required'),
    late_threshold_minutes: minutesField,
    early_departure_threshold_minutes: minutesField,
    duplicate_scan_window_seconds: z
      .string()
      .min(1, 'Required')
      .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 3600, {
        message: 'Enter a whole number between 0 and 3600',
      }),
    working_days: z.array(z.number().int().min(0).max(6)).min(1, 'Select at least one working day'),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: 'End time must be after start time',
    path: ['end_time'],
  });

export type AttendanceConfigFormValues = z.infer<typeof attendanceConfigSchema>;

export const calendarEntrySchema = z
  .object({
    date: z.string().min(1, 'Date is required'),
    day_type: z.enum(['working', 'holiday', 'half_day', 'exam_day']),
    label: z.string().max(255, 'Too long').optional(),
    half_day_end_time: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.day_type === 'half_day' && !data.half_day_end_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required for a half day',
        path: ['half_day_end_time'],
      });
    }
  });

export type CalendarEntryFormValues = z.infer<typeof calendarEntrySchema>;

export const calendarRangeSchema = z
  .object({
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    day_type: z.enum(['working', 'holiday', 'half_day', 'exam_day']),
    label: z.string().max(255, 'Too long').optional(),
    half_day_end_time: z.string().optional(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'End date must be on or after the start date',
    path: ['end_date'],
  })
  .superRefine((data, ctx) => {
    if (data.day_type === 'half_day' && !data.half_day_end_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required for a half day',
        path: ['half_day_end_time'],
      });
    }
  });

export type CalendarRangeFormValues = z.infer<typeof calendarRangeSchema>;
