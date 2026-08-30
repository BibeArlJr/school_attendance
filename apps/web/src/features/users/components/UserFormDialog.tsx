import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateUser } from '../hooks/useCreateUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { userAccountSchema, type UserAccountFormValues } from '../schema';
import type { UserAccount } from '../types';
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
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: UserAccount | null;
  licenseExpired: boolean;
}

function defaultsFor(account?: UserAccount | null): UserAccountFormValues {
  return {
    name: account?.name ?? '',
    email: account?.email ?? '',
    // Role field is only shown (and only meaningful) on create — see
    // below — so this default is really "the initial selection for a
    // new account," not a fallback for an existing one.
    role: 'guard',
    designation: account?.designation ?? '',
  };
}

export function UserFormDialog({ open, onOpenChange, account, licenseExpired }: UserFormDialogProps) {
  const isEdit = Boolean(account);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [revealPassword, setRevealPassword] = useState<string | null>(null);

  const form = useForm<UserAccountFormValues>({
    resolver: zodResolver(userAccountSchema),
    defaultValues: defaultsFor(account),
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(account));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account]);

  function onSubmit(values: UserAccountFormValues) {
    if (isEdit && account) {
      void updateUser.mutateAsync({ id: account.uuid, values }).then(() => onOpenChange(false));
      return;
    }

    void createUser.mutateAsync(values).then((result) => {
      onOpenChange(false);
      setRevealPassword(result.temporary_password);
    });
  }

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
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
                      <Input placeholder="Vice Principal" {...field} />
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
                  {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add user'}
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
        title="User account created"
      />
    </>
  );
}
