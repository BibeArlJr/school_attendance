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
import { extractErrorMessage } from '@/shared/lib/errors';

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
}

function defaultsFor(student?: Student | null): StudentFormValues {
  return {
    class_id: student?.class_id ? String(student.class_id) : '',
    first_name: student?.first_name ?? '',
    last_name: student?.last_name ?? '',
    // Imported students have no `dob` (only `dob_bs`) — `?.` alone
    // doesn't protect against `dob` itself being null once `student`
    // exists, so this stays optional-chained one level deeper too.
    dob: student?.dob?.slice(0, 10) ?? '',
    gender: student?.gender ?? 'male',
    admission_date: student?.admission_date.slice(0, 10) ?? '',
    roll_no: '',
    address: student?.address ?? '',
    guardian_name: '',
    guardian_phone: '',
  };
}

export function StudentFormDialog({ open, onOpenChange, student }: StudentFormDialogProps) {
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
      await updateStudent.mutateAsync({ id: student.id, values });
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
        await studentGuardiansApi.link(newStudent.id, {
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
          <DialogTitle>{isEdit ? 'Edit Student' : 'Add Student'}</DialogTitle>
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
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
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
            </div>

            <FormField
              control={form.control}
              name="admission_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Roll No./Address/Guardian only apply to a brand-new student —
                editing an existing one manages these elsewhere (enrollment
                isn't re-threaded on edit, and guardians have their own
                section on the detail page). */}
            {!isEdit && (
              <>
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
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add student'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
