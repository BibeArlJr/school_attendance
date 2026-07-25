import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSchoolProfile } from '../hooks/useSettingsQueries';
import { useUpdateSchoolProfile } from '../hooks/useUpdateSchoolProfile';
import { useUploadSchoolLogo } from '../hooks/useUploadSchoolLogo';
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
import { LICENSE_EXPIRED_MESSAGE, useLicenseExpired } from '@/shared/hooks/useLicenseExpired';
import { extractErrorMessage } from '@/shared/lib/errors';

export function SchoolProfileSection() {
  // No canManage prop here — every Settings sub-section is only ever
  // rendered on a route already gated admin/super_admin-only
  // (config/modules.php's 'settings' entry), so this is safe unconditional.
  const licenseExpired = useLicenseExpired();
  const profileQuery = useSchoolProfile();
  const updateProfile = useUpdateSchoolProfile();
  const uploadLogo = useUploadSchoolLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SchoolProfileFormValues>({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: { name: '', primary_color: '' },
  });

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        name: profileQuery.data.name,
        primary_color: profileQuery.data.primary_color ?? '',
      });
    }
  }, [profileQuery.data, form]);

  function onSubmit(values: SchoolProfileFormValues) {
    updateProfile.mutate({
      name: values.name,
      primary_color: values.primary_color || null,
    });
  }

  function handleLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadLogo.mutate(file);
    event.target.value = '';
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

        <div className="mb-4 space-y-1.5">
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            {profileQuery.data.logo_url ? (
              <img
                src={profileQuery.data.logo_url}
                alt=""
                className="size-12 rounded-md border object-contain"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-md border text-xs text-muted-foreground">
                None
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadLogo.isPending || licenseExpired}
              title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadLogo.isPending ? 'Uploading…' : 'Upload logo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoFileChange}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WebP, up to 2MB. Applied immediately across the app — Topbar, login
            screen, and ID cards.
          </p>
          {uploadLogo.isError && (
            <p className="text-sm text-destructive">{extractErrorMessage(uploadLogo.error)}</p>
          )}
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
              name="primary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={field.value || '#2563eb'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-10 w-16 cursor-pointer rounded-md border p-1"
                      />
                      <span className="text-sm text-muted-foreground">{field.value || '#2563eb'}</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={updateProfile.isPending || licenseExpired}
              title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
            >
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
