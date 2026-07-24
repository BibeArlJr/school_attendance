import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSchoolProfile } from '../hooks/useSettingsQueries';
import { useUpdateSchoolProfile } from '../hooks/useUpdateSchoolProfile';
import { schoolProfileSchema, type SchoolProfileFormValues } from '../schema';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
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
import { extractErrorMessage } from '@/shared/lib/errors';

export function SchoolProfileSection() {
  const profileQuery = useSchoolProfile();
  const updateProfile = useUpdateSchoolProfile();

  const form = useForm<SchoolProfileFormValues>({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: { name: '', logo_url: '', primary_color: '' },
  });

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        name: profileQuery.data.name,
        logo_url: profileQuery.data.logo_url ?? '',
        primary_color: profileQuery.data.primary_color ?? '',
      });
    }
  }, [profileQuery.data, form]);

  function onSubmit(values: SchoolProfileFormValues) {
    updateProfile.mutate({
      name: values.name,
      logo_url: values.logo_url || null,
      primary_color: values.primary_color || null,
    });
  }

  if (profileQuery.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingSkeleton lines={4} />
        </CardContent>
      </Card>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ErrorState onRetry={() => profileQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-1.5">
          <Label htmlFor="school_code">School code</Label>
          <Input id="school_code" value={profileQuery.data.school_code ?? '—'} disabled />
          <p className="text-xs text-muted-foreground">
            Permanent — it&apos;s embedded in every barcode already issued to a student or staff
            member, so changing it here would break every card printed so far.
          </p>
        </div>

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
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://…" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary color</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="#2563EB" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </Button>
            {updateProfile.isError && (
              <p className="text-sm text-destructive">{extractErrorMessage(updateProfile.error)}</p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
