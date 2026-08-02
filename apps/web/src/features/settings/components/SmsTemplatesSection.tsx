import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSchoolProfile, useSmsTemplates } from '../hooks/useSettingsQueries';
import { useUpdatePlatformSmsTemplate, useUpdateSmsTemplate } from '../hooks/useUpdateSmsTemplate';
import { smsTemplatesSchema, type SmsTemplatesFormValues } from '../schema';
import type { SmsTemplateType } from '../types';
import { SmsTemplateEditor } from './SmsTemplateEditor';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useCan } from '@/shared/hooks/useCan';
import { useLicenseExpired } from '@/shared/hooks/useLicenseExpired';

const TYPE_LABEL: Record<SmsTemplateType, string> = {
  attendance_in: 'Gate entry (IN)',
  attendance_out: 'Gate departure (OUT)',
};

const TYPES: SmsTemplateType[] = ['attendance_in', 'attendance_out'];

const PLACEHOLDERS = [
  { token: '{student_name}', description: "the student's full name" },
  { token: '{school_name}', description: "this school's name" },
  { token: '{time}', description: 'the scan time (e.g. 2:45 PM)' },
];

const EMPTY_DRAFT: SmsTemplatesFormValues = { attendance_in: '', attendance_out: '' };

export function SmsTemplatesSection() {
  const licenseExpired = useLicenseExpired();
  const isSuperAdmin = useCan(['super_admin']);
  const templatesQuery = useSmsTemplates();
  const schoolProfileQuery = useSchoolProfile();
  const updateTemplate = useUpdateSmsTemplate();
  const updatePlatformTemplate = useUpdatePlatformSmsTemplate();

  // Two independent forms, not one — a school admin only ever has the
  // first; super_admin gets both, and each Save button below acts on
  // just its own field via getValues(), not a combined submit (Prompt
  // 50's "template editing only affects the editor's own school, or the
  // platform default, never both at once" constraint).
  const schoolForm = useForm<SmsTemplatesFormValues>({
    resolver: zodResolver(smsTemplatesSchema),
    defaultValues: EMPTY_DRAFT,
  });
  const platformForm = useForm<SmsTemplatesFormValues>({
    resolver: zodResolver(smsTemplatesSchema),
    defaultValues: EMPTY_DRAFT,
  });

  useEffect(() => {
    if (!templatesQuery.data) return;
    const { templates } = templatesQuery.data;
    schoolForm.reset({
      attendance_in: templates.attendance_in.school_override_text ?? '',
      attendance_out: templates.attendance_out.school_override_text ?? '',
    });
    platformForm.reset({
      attendance_in: templates.attendance_in.platform_default_text ?? '',
      attendance_out: templates.attendance_out.platform_default_text ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templatesQuery.data]);

  const watchedSchool = schoolForm.watch();
  const watchedPlatform = platformForm.watch();

  if (templatesQuery.isLoading || schoolProfileQuery.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingSkeleton lines={6} />
        </CardContent>
      </Card>
    );
  }

  if (templatesQuery.isError || !templatesQuery.data || !schoolProfileQuery.data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ErrorState onRetry={() => templatesQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const { templates } = templatesQuery.data;
  const schoolName = schoolProfileQuery.data.name;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Placeholders</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {PLACEHOLDERS.map((p) => (
              <li key={p.token}>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{p.token}</code>{' '}
                <span className="text-muted-foreground">— {p.description}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your school&apos;s message templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {TYPES.map((type) => (
            <SmsTemplateEditor
              key={type}
              label={TYPE_LABEL[type]}
              value={watchedSchool[type]}
              onChange={(value) => schoolForm.setValue(type, value)}
              onSave={() =>
                updateTemplate.mutate({ type, templateText: schoolForm.getValues(type) })
              }
              onReset={() => updateTemplate.mutate({ type, templateText: '' })}
              isSaving={updateTemplate.isPending}
              isResetting={updateTemplate.isPending}
              isOverridden={templates[type].is_overridden}
              fallbackText={templates[type].platform_default_text}
              schoolNameForPreview={schoolName}
              licenseExpired={licenseExpired}
              helperText={
                templates[type].is_overridden
                  ? 'This school uses a custom message for this event.'
                  : "Currently sending the platform default — type your own message below to override it for this school only, or leave it blank to keep tracking the platform default."
              }
            />
          ))}
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card className="border-amber-400/60">
          <CardHeader>
            <CardTitle>Platform default templates</CardTitle>
            <p className="text-sm text-muted-foreground">
              super_admin only — every school without its own custom override (above) falls back to
              these. Editing here changes the default for every school on the platform, not just this
              one.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {TYPES.map((type) => (
              <SmsTemplateEditor
                key={type}
                label={TYPE_LABEL[type]}
                value={watchedPlatform[type]}
                onChange={(value) => platformForm.setValue(type, value)}
                onSave={() =>
                  updatePlatformTemplate.mutate({
                    type,
                    templateText: platformForm.getValues(type),
                  })
                }
                isSaving={updatePlatformTemplate.isPending}
                schoolNameForPreview={schoolName}
                // Not gated by this (or any) school's license — the
                // platform default sits above per-school license
                // concerns, same as the backend route, which has no
                // license-active middleware on it either.
                licenseExpired={false}
                helperText="Fallback for every school that hasn't set its own override."
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
