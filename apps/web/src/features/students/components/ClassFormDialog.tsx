import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateClass } from '../hooks/useCreateClass';
import { useUpdateClass } from '../hooks/useUpdateClass';
import { classSchema, type ClassFormValues } from '../schema';
import type { SchoolClass } from '../types';
import { useTeachers } from '@/features/teachers/hooks/useTeachers';
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

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolClass?: SchoolClass | null;
}

function defaultsFor(schoolClass?: SchoolClass | null): ClassFormValues {
  return {
    name: schoolClass?.name ?? '',
    section: schoolClass?.section ?? '',
    class_teacher_id: schoolClass?.class_teacher_id ? String(schoolClass.class_teacher_id) : 'none',
  };
}

export function ClassFormDialog({ open, onOpenChange, schoolClass }: ClassFormDialogProps) {
  const isEdit = Boolean(schoolClass);
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  // Only active teachers are offered as a class teacher — a resigned or
  // on-leave teacher shouldn't be assignable to a new class, matching the
  // spec's `employment_status=active` filter.
  const activeTeachersQuery = useTeachers({ employment_status: 'active', per_page: 100 });

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: defaultsFor(schoolClass),
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(schoolClass));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, schoolClass]);

  function onSubmit(values: ClassFormValues) {
    const mutation =
      isEdit && schoolClass
        ? updateClass.mutateAsync({ id: schoolClass.id, values })
        : createClass.mutateAsync(values);

    void mutation.then(() => onOpenChange(false));
  }

  const isPending = createClass.isPending || updateClass.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Class' : 'Add Class'}</DialogTitle>
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
                    <Input placeholder="Grade 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="class_teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class teacher (optional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No teacher assigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No teacher assigned</SelectItem>
                      {activeTeachersQuery.data?.data.map((teacher) => (
                        <SelectItem key={teacher.id} value={String(teacher.user_id)}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add class'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
