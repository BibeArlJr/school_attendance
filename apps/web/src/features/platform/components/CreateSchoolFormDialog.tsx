import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateSchool } from '../hooks/useCreateSchool';
import { createSchoolSchema, type CreateSchoolFormValues } from '../schema';
import { PasswordRevealDialog } from '@/features/teachers/components/PasswordRevealDialog';
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

interface CreateSchoolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULTS: CreateSchoolFormValues = {
  school_code: '',
  name: '',
  contact_email: '',
  contact_phone: '',
  admin_name: '',
  admin_email: '',
  admin_phone: '',
};

export function CreateSchoolFormDialog({ open, onOpenChange }: CreateSchoolFormDialogProps) {
  const createSchool = useCreateSchool();
  const [revealPassword, setRevealPassword] = useState<string | null>(null);
  const [revealEmail, setRevealEmail] = useState<string | null>(null);

  const form = useForm<CreateSchoolFormValues>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset(DEFAULTS);
      createSchool.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onSubmit(values: CreateSchoolFormValues) {
    void createSchool
      .mutateAsync({
        school_code: values.school_code,
        name: values.name,
        contact_email: values.contact_email || undefined,
        contact_phone: values.contact_phone || undefined,
        admin_name: values.admin_name,
        admin_email: values.admin_email,
        admin_phone: values.admin_phone || undefined,
      })
      .then((result) => {
        onOpenChange(false);
        setRevealEmail(result.admin_email);
        setRevealPassword(result.temporary_password);
      });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create School</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="school_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School code</FormLabel>
                    <FormControl>
                      <Input placeholder="SCH002" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact phone (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-md border p-3">
                <p className="mb-3 text-sm font-medium">First admin account</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="admin_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admin_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admin_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin phone (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Used for license expiry reminder texts.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {createSchool.isError && (
                <p className="text-sm text-destructive">
                  {extractErrorMessage(createSchool.error)}
                </p>
              )}

              <DialogFooter>
                <Button type="submit" disabled={createSchool.isPending}>
                  {createSchool.isPending ? 'Creating…' : 'Create school'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PasswordRevealDialog
        open={revealPassword !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setRevealPassword(null);
            setRevealEmail(null);
          }
        }}
        password={revealPassword}
        title={revealEmail ? `School admin created — ${revealEmail}` : 'School admin created'}
      />
    </>
  );
}
