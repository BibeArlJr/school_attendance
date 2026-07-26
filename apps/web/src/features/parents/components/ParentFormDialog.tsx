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
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';

// Narrowed to just what this form actually reads (name/phone/email/uuid)
// rather than the full ParentGuardian shape, so callers can pass a
// guardian-link's embedded `parent` object directly (Prompt 47 —
// GuardiansSection reuses this dialog for "edit contact info", and that
// object doesn't carry every ParentGuardian field, e.g. school_id).
type EditableParent = Pick<ParentGuardian, 'uuid' | 'name' | 'phone' | 'email'>;

interface ParentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parent?: EditableParent | null;
  licenseExpired: boolean;
}

function defaultsFor(parent?: EditableParent | null): ParentFormValues {
  return {
    name: parent?.name ?? '',
    phone: parent?.phone ?? '',
    email: parent?.email ?? '',
  };
}

export function ParentFormDialog({ open, onOpenChange, parent, licenseExpired }: ParentFormDialogProps) {
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
              <Button
                type="submit"
                disabled={isPending || licenseExpired}
                title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
              >
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add parent'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
