import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateStaff } from '../hooks/useCreateStaff';
import { useUpdateStaff } from '../hooks/useUpdateStaff';
import { staffSchema, type StaffFormValues } from '../schema';
import type { Staff } from '../types';
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

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: Staff | null;
  licenseExpired: boolean;
}

function defaultsFor(staff?: Staff | null): StaffFormValues {
  return {
    name: staff?.name ?? '',
    mobile: staff?.mobile ?? '',
    dob_bs: staff?.dob_bs ?? '',
    address: staff?.address ?? '',
    citizenship_number: staff?.citizenship_number ?? '',
    designation: staff?.designation ?? '',
    rank: staff?.rank ?? '',
    sheet_roll_no: staff?.sheet_roll_no ?? '',
    level: staff?.level ?? '',
  };
}

export function StaffFormDialog({ open, onOpenChange, staff, licenseExpired }: StaffFormDialogProps) {
  const isEdit = Boolean(staff);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();

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

    void createStaff.mutateAsync(values).then(() => onOpenChange(false));
  }

  const isPending = createStaff.isPending || updateStaff.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="Head Teacher" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rank</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <Input placeholder="Secondary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sheet_roll_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sheet Roll No.</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input placeholder="98XXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dob_bs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth (BS)</FormLabel>
                    <FormControl>
                      <Input placeholder="2040-01-15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="citizenship_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Citizenship Number</FormLabel>
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add staff member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
