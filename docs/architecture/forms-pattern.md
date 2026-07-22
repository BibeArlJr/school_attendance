# Forms Pattern

Every form in this project — login now, Student/Teacher/Parent/Barcode
forms from Phase 2 onward — follows the same four-part convention. Once
you've built one form this way, every later form is a copy-paste of the
same shape with different fields.

## The four parts

1. **Zod schema — the single source of truth for shape and validation.**
   Colocated with the feature that owns the form, in a dedicated
   `schema.ts` (not mixed into `types/index.ts`, which holds plain type
   declarations with no runtime code):

   ```
   features/<feature>/schema.ts
   ```

   ```ts
   import { z } from 'zod';

   export const loginSchema = z.object({
     email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
     password: z.string().min(1, 'Password is required'),
   });

   export type LoginFormValues = z.infer<typeof loginSchema>;
   ```

   The TypeScript type is **inferred from the schema** (`z.infer`), never
   hand-duplicated as a separate interface — one definition, not two that
   can drift apart.

2. **`react-hook-form` + `zodResolver`** wires the schema into form state:

   ```ts
   const form = useForm<LoginFormValues>({
     resolver: zodResolver(loginSchema),
     defaultValues: { email: '', password: '' },
   });
   ```

3. **shadcn `Form` components** (`shared/components/ui/form.tsx`) render
   fields and inline errors — never raw `<input>` + manual `useState`:

   ```tsx
   <Form {...form}>
     <form onSubmit={form.handleSubmit(onSubmit)}>
       <FormField
         control={form.control}
         name="email"
         render={({ field }) => (
           <FormItem>
             <FormLabel>Email</FormLabel>
             <FormControl>
               <Input type="email" {...field} />
             </FormControl>
             <FormMessage />
           </FormItem>
         )}
       />
     </form>
   </Form>
   ```

   `FormMessage` renders the Zod validation error for that field
   automatically — no manual error-string plumbing per field.

4. **Submission goes through a TanStack Query mutation hook** — never a
   raw `onSubmit` calling the API service directly:

   ```ts
   // features/auth/hooks/useLogin.ts
   export function useLogin() {
     return useMutation({ mutationFn: authApi.login, onSuccess: ... });
   }
   ```

   The form's `onSubmit(values)` calls `login.mutate(values)`; loading and
   error state come from the mutation (`login.isPending`, `login.isError`),
   not local component state.

## Reference implementation

`features/auth/pages/LoginPage.tsx` + `features/auth/schema.ts` is the
worked example. Copy its shape for the next form rather than re-deciding
the pattern.

## Why this order (schema → resolver → shadcn Form → mutation)

- The schema is reusable on its own (e.g. validating the same shape before
  an optimistic update, or sharing a sub-schema across a create/edit pair)
  precisely because it doesn't know about React at all.
- `zodResolver` is the only glue code between Zod and `react-hook-form` —
  swapping either library later touches one line, not every field.
- shadcn's `Form*` components keep field markup, label association
  (`htmlFor`/`aria-describedby`), and error display consistent across every
  form without re-deriving accessibility wiring each time.
- Routing submission through a mutation hook keeps the same real-vs-mock
  and loading/error conventions used everywhere else in the app (see
  `docs/architecture/service-pattern.md`) — a form is not a special case.
