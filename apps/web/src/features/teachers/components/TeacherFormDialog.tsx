import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTeacher } from '../hooks/useCreateTeacher';
import { useUpdateTeacher } from '../hooks/useUpdateTeacher';
import { teacherSchema, type TeacherFormValues } from '../schema';
import type { Teacher } from '../types';
import { PasswordRevealDialog } from './PasswordRevealDialog';
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

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: Teacher | null;
}

function defaultsFor(teacher?: Teacher | null): TeacherFormValues {
  return {
    name: teacher?.name ?? '',
    email: teacher?.email ?? '',
    role: teacher?.role ?? 'teacher',
    designation: teacher?.designation ?? '',
    qualification: teacher?.qualification ?? '',
    joined_date: teacher?.joined_date.slice(0, 10) ?? '',
  };
}

export function TeacherFormDialog({ open, onOpenChange, teacher }: TeacherFormDialogProps) {
  const isEdit = Boolean(teacher);
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const [revealPassword, setRevealPassword] = useState<string | null>(null);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: defaultsFor(teacher),
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(teacher));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teacher]);

  function onSubmit(values: TeacherFormValues) {
    if (isEdit && teacher) {
      void updateTeacher.mutateAsync({ id: teacher.uuid, values }).then(() => onOpenChange(false));
      return;
    }

    void createTeacher.mutateAsync(values).then((result) => {
      onOpenChange(false);
      setRevealPassword(result.temporary_password);
    });
  }

  const isPending = createTeacher.isPending || updateTeacher.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              {!isEdit && (
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="guard">Guard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="Science Teacher" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualification (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="M.Sc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="joined_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joined date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add staff member'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PasswordRevealDialog
        open={revealPassword !== null}
        onOpenChange={(nextOpen) => !nextOpen && setRevealPassword(null)}
        password={revealPassword}
        title="Staff account created"
      />
    </>
  );
}
