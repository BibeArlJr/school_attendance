import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateStaff } from '../hooks/useCreateStaff';
import { useUpdateStaff } from '../hooks/useUpdateStaff';
import { staffSchema, type StaffFormValues } from '../schema';
import type { Staff } from '../types';
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

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: Staff | null;
}

function defaultsFor(staff?: Staff | null): StaffFormValues {
  return {
    name: staff?.name ?? '',
    email: staff?.email ?? '',
    // Role field is only shown (and only meaningful) on create — see
    // below — so this default is really "the initial selection for a
    // new staff member," not a fallback for an existing one.
    role: 'guard',
    designation: staff?.designation ?? '',
  };
}

export function StaffFormDialog({ open, onOpenChange, staff }: StaffFormDialogProps) {
  const isEdit = Boolean(staff);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const [revealPassword, setRevealPassword] = useState<string | null>(null);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: defaultsFor(staff),
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(staff));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, staff]);

  function onSubmit(values: StaffFormValues) {
    if (isEdit && staff) {
      void updateStaff.mutateAsync({ id: staff.uuid, values }).then(() => onOpenChange(false));
      return;
    }

    void createStaff.mutateAsync(values).then((result) => {
      onOpenChange(false);
      setRevealPassword(result.temporary_password);
    });
  }

  const isPending = createStaff.isPending || updateStaff.isPending;

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
                          <SelectItem value="guard">Guard</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
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
                    <FormLabel>Designation (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Science Teacher" {...field} />
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
