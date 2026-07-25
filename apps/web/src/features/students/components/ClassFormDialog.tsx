import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateClass } from '../hooks/useCreateClass';
import { useUpdateClass } from '../hooks/useUpdateClass';
import { classSchema, type ClassFormValues } from '../schema';
import type { SchoolClass } from '../types';
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
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolClass?: SchoolClass | null;
  licenseExpired: boolean;
}

function defaultsFor(schoolClass?: SchoolClass | null): ClassFormValues {
  return {
    name: schoolClass?.name ?? '',
    section: schoolClass?.section ?? '',
    class_teacher_name: schoolClass?.class_teacher_name ?? '',
  };
}

export function ClassFormDialog({ open, onOpenChange, schoolClass, licenseExpired }: ClassFormDialogProps) {
  const isEdit = Boolean(schoolClass);
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();

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
        ? updateClass.mutateAsync({ id: schoolClass.uuid, values })
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
              name="class_teacher_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class teacher (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sunita Rana" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={isPending || licenseExpired}
                title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
              >
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add class'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
