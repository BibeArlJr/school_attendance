import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useClasses } from '../hooks/useClasses';
import { useCreateStudent } from '../hooks/useCreateStudent';
import { useUpdateStudent } from '../hooks/useUpdateStudent';
import { studentSchema, type StudentFormValues } from '../schema';
import type { Student } from '../types';
import { parentsApi, studentGuardiansApi } from '@/features/parents/api/parentsApi';
import { GuardiansSection } from '@/features/parents/components/GuardiansSection';
import { BsDatePicker } from '@/shared/components/BsDatePicker';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';
import { parseBsDateString, toAd } from '@/shared/lib/bikramSambat';
import { extractErrorMessage } from '@/shared/lib/errors';

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  licenseExpired: boolean;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Bug fix (Prompt 35 Part C): the previous version only ever read
 * `student.dob` (AD), which is null for every bulk-imported student —
 * they only have `dob_bs` set. BsDatePicker's value is always AD (see
 * its own docblock), so this converts dob_bs -> AD the same way
 * formatDobBs already does for the read-only Detail page display,
 * instead of silently falling through to an empty (blank-looking)
 * picker for exactly the students most likely to need editing.
 */
function dobDefaultFor(student?: Student | null): string {
  if (!student) return '';
  if (student.dob) return student.dob.slice(0, 10);
  if (student.dob_bs) return toAd(parseBsDateString(student.dob_bs));
  return '';
}

function defaultsFor(student?: Student | null): StudentFormValues {
  return {
    class_id: student?.class_id ? String(student.class_id) : '',
    first_name: student?.first_name ?? '',
    last_name: student?.last_name ?? '',
    dob: dobDefaultFor(student),
    // undefined (not a silent 'male' default) for a brand-new student —
    // Add no longer collects this at all (Prompt 47 Part B). An existing
    // student keeps whatever it already has, including undefined for the
    // ~99% of current students (bulk-imported, never had one recorded).
    gender: student?.gender ?? undefined,
    // No longer a visible field (Prompt 35 Part B) — a new student
    // silently defaults to today; editing an existing one silently keeps
    // whatever admission_date it already has. Still sent to the backend
    // exactly as before (studentsApi.ts), which still requires it —
    // frontend-only removal, nothing server-side changed.
    admission_date: student?.admission_date.slice(0, 10) ?? today(),
    // Prompt 47: previously always '', regardless of mode — an existing
    // student's current roll number never had anywhere to come from
    // since Edit didn't show this field at all.
    roll_no: student?.current_enrollment?.roll_no ?? '',
    address: student?.address ?? '',
    // Quick-add-on-create fields only (see the guardian section render
    // below) — an existing student's guardians are managed via the full
    // GuardiansSection embedded in Edit mode instead, never through
    // these two fields.
    guardian_name: '',
    guardian_phone: '',
  };
}

export function StudentFormDialog({ open, onOpenChange, student, licenseExpired }: StudentFormDialogProps) {
  const isEdit = Boolean(student);
  const classesQuery = useClasses();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const [isLinkingGuardian, setIsLinkingGuardian] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: defaultsFor(student),
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(student));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student]);

  async function onSubmit(values: StudentFormValues) {
    if (isEdit && student) {
      await updateStudent.mutateAsync({ id: student.uuid, values });
      onOpenChange(false);
      return;
    }

    const newStudent = await createStudent.mutateAsync(values);

    // Guardian linking is a separate, existing endpoint (Phase 5) — a
    // failure here never rolls back the student that was already
    // created successfully; it's reported and left for manual follow-up.
    const guardianName = values.guardian_name?.trim();
    const guardianPhone = values.guardian_phone?.trim();
    if (guardianName && guardianPhone) {
      setIsLinkingGuardian(true);
      try {
        const match = await parentsApi.searchByPhone(guardianPhone);
        await studentGuardiansApi.link(newStudent.uuid, {
          hasExistingMatch: Boolean(match),
          parent_id: match?.id,
          name: match ? undefined : guardianName,
          phone: match ? undefined : guardianPhone,
          email: '',
          relation: 'guardian',
          is_primary_contact: true,
        });
      } catch (error) {
        toast.error(
          `Student created, but guardian could not be linked: ${extractErrorMessage(error)}. Add manually from the student's detail page.`,
        );
      } finally {
        setIsLinkingGuardian(false);
      }
    }

    onOpenChange(false);
  }

  const isPending = createStudent.isPending || updateStudent.isPending || isLinkingGuardian;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit && student?.barcode_value ? `Editing ${student.barcode_value}` : isEdit ? 'Edit Student' : 'Add Student'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classesQuery.data?.map((schoolClass) => (
                        <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>
                          {schoolClass.name}
                          {schoolClass.section ? ` - ${schoolClass.section}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of birth</FormLabel>
                    <FormControl>
                      <BsDatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Add-only removal (Prompt 47 Part B) — a brand-new manual
                  entry rarely has this on hand and it isn't required for
                  anything downstream; nearly all existing students already
                  have no gender recorded (bulk import never collected it
                  either), so a null value here is the common case, not an
                  edge case — hence the explicit placeholder below rather
                  than silently coercing to a default choice nobody made. */}
              {isEdit && (
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Not recorded" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roll_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll No. (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Edit: the full Guardians section (list, add-with-dedupe,
                edit contact info, change primary, unlink) — the same
                component the student's detail page uses (Prompt 47).
                Add: the lighter quick-link fields below, unchanged —
                a brand-new student's own uuid doesn't exist yet, so
                the full section (which needs one to fetch/link against)
                can't render until after creation. */}
            {isEdit && student ? (
              <GuardiansSection studentId={student.uuid} licenseExpired={licenseExpired} />
            ) : (
              <>
                <div className="space-y-3 rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Guardian (optional)</p>
                    <p className="text-xs text-muted-foreground">
                      Fill in both fields to link a guardian now — matches an existing guardian by
                      phone, or creates a new one. Leave blank to add one later from the student's
                      detail page.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guardian_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guardian name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guardian_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guardian phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="submit"
                disabled={isPending || licenseExpired}
                title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
              >
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add student'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
