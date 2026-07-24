import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateParent } from '../hooks/useCreateParent';
import { useUpdateParent } from '../hooks/useUpdateParent';
import { parentSchema, type ParentFormValues } from '../schema';
import type { ParentGuardian } from '../types';
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

interface ParentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parent?: ParentGuardian | null;
}

function defaultsFor(parent?: ParentGuardian | null): ParentFormValues {
  return {
    name: parent?.name ?? '',
    phone: parent?.phone ?? '',
    email: parent?.email ?? '',
  };
}

export function ParentFormDialog({ open, onOpenChange, parent }: ParentFormDialogProps) {
  const isEdit = Boolean(parent);
  const createParent = useCreateParent();
  const updateParent = useUpdateParent();

  const form = useForm<ParentFormValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: defaultsFor(parent),
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(parent));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parent]);

  function onSubmit(values: ParentFormValues) {
    const mutation =
      isEdit && parent
        ? updateParent.mutateAsync({ id: parent.uuid, values })
        : createParent.mutateAsync(values);

    void mutation.then(() => onOpenChange(false));
  }

  const isPending = createParent.isPending || updateParent.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Parent' : 'Add Parent'}</DialogTitle>
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
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
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add parent'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
