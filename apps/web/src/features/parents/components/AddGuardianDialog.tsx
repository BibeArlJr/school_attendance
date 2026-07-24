import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLinkGuardian } from '../hooks/useLinkGuardian';
import { useParentPhoneSearch } from '../hooks/useParentPhoneSearch';
import { addGuardianSchema, RELATION_OPTIONS, type AddGuardianFormValues } from '../schema';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
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
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

interface AddGuardianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

const DEFAULT_VALUES: AddGuardianFormValues = {
  hasExistingMatch: false,
  name: '',
  email: '',
  relation: 'father',
  is_primary_contact: false,
};

export function AddGuardianDialog({ open, onOpenChange, studentId }: AddGuardianDialogProps) {
  const [phone, setPhone] = useState('');
  const [debouncedPhone, setDebouncedPhone] = useState('');
  const linkGuardian = useLinkGuardian(studentId);

  const form = useForm<AddGuardianFormValues>({
    resolver: zodResolver(addGuardianSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    const id = setTimeout(() => setDebouncedPhone(phone), 300);
    return () => clearTimeout(id);
  }, [phone]);

  const searchQuery = useParentPhoneSearch(debouncedPhone);
  const match = searchQuery.data ?? null;

  useEffect(() => {
    form.setValue('hasExistingMatch', Boolean(match));
  }, [match, form]);

  function onSubmit(values: AddGuardianFormValues) {
    void linkGuardian
      .mutateAsync({
        ...values,
        parent_id: match?.id,
        phone: match ? undefined : debouncedPhone,
      })
      .then(() => onOpenChange(false));
  }

  const showNewParentFields = debouncedPhone.length > 0 && !searchQuery.isFetching && !match;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Guardian</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guardian-phone">Phone number</Label>
              <Input
                id="guardian-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="98XXXXXXXX"
              />
            </div>

            {debouncedPhone.length > 0 && searchQuery.isFetching && (
              <p className="text-sm text-muted-foreground">Searching…</p>
            )}

            {match && (
              <div className="rounded-md border bg-muted/50 p-3 text-sm">
                Link existing parent: <span className="font-medium">{match.name}</span>
                <span className="text-muted-foreground"> ({match.phone})</span>
              </div>
            )}

            {showNewParentFields && (
              <>
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
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relation</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a relation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RELATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_primary_contact"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Set as primary contact</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={linkGuardian.isPending || debouncedPhone.length === 0}>
                {linkGuardian.isPending ? 'Saving…' : match ? 'Link Guardian' : 'Create & Link'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
