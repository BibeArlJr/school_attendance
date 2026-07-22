import { z } from 'zod';

export const parentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Too long'),
  phone: z.string().min(1, 'Phone is required').max(50, 'Too long'),
  email: z.string().max(255, 'Too long').email('Invalid email').optional().or(z.literal('')),
});

export type ParentFormValues = z.infer<typeof parentSchema>;

export const RELATION_OPTIONS: { value: 'father' | 'mother' | 'guardian' | 'other'; label: string }[] = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

// `hasExistingMatch` is a hidden form field (set from the debounced phone
// search result, not user-entered) rather than a branch-built schema —
// keeping one stable schema shape means react-hook-form's generic always
// matches the resolver's inferred type exactly, the same reason students'
// schema.ts avoids z.coerce/z.preprocess. `name` is only required when no
// existing parent match was found.
export const addGuardianSchema = z
  .object({
    hasExistingMatch: z.boolean(),
    name: z.string().max(255, 'Too long').optional(),
    email: z.string().max(255, 'Too long').email('Invalid email').optional().or(z.literal('')),
    relation: z.enum(['father', 'mother', 'guardian', 'other']),
    is_primary_contact: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.hasExistingMatch && !data.name?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['name'], message: 'Name is required' });
    }
  });

export type AddGuardianFormValues = z.infer<typeof addGuardianSchema>;
