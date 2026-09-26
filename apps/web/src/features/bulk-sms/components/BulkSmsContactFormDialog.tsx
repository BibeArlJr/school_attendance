import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateBulkSmsContact } from '../hooks/useCreateBulkSmsContact';
import { useUpdateBulkSmsContact } from '../hooks/useUpdateBulkSmsContact';
import { bulkSmsContactSchema, type BulkSmsContactFormValues } from '../schema';
import type { BulkSmsContact } from '../types';
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
import { extractErrorMessage } from '@/shared/lib/errors';

interface BulkSmsContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: BulkSmsContact | null;
}

function defaultsFor(contact?: BulkSmsContact | null): BulkSmsContactFormValues {
  return {
    name: contact?.name ?? '',
    phone: contact?.phone ?? '',
  };
}

export function BulkSmsContactFormDialog({ open, onOpenChange, contact }: BulkSmsContactFormDialogProps) {
  const isEdit = Boolean(contact);
  const createContact = useCreateBulkSmsContact();
  const updateContact = useUpdateBulkSmsContact();

  const form = useForm<BulkSmsContactFormValues>({
    resolver: zodResolver(bulkSmsContactSchema),
    defaultValues: defaultsFor(contact),
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(contact));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact]);

  function onSubmit(values: BulkSmsContactFormValues) {
    if (isEdit && contact) {
      void updateContact.mutateAsync({ uuid: contact.uuid, values }).then(() => onOpenChange(false));
      return;
    }

    void createContact.mutateAsync(values).then(() => onOpenChange(false));
  }

  const mutation = isEdit ? updateContact : createContact;
  const isPending = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (optional)</FormLabel>
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
                    <Input placeholder="98XXXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mutation.isError && (
              <p className="text-sm text-destructive">{extractErrorMessage(mutation.error)}</p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add contact'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
