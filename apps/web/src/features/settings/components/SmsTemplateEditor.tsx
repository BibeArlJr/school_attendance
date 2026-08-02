import { useMemo } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';
import { calculateSmsSegments } from '@/shared/lib/smsSegments';

const SAMPLE_PLACEHOLDERS = {
  student_name: 'Ram Sharma',
  time: '2:45 PM',
};

function interpolate(template: string, schoolName: string): string {
  return template
    .replaceAll('{student_name}', SAMPLE_PLACEHOLDERS.student_name)
    .replaceAll('{school_name}', schoolName)
    .replaceAll('{time}', SAMPLE_PLACEHOLDERS.time);
}

interface SmsTemplateEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  /** Undefined hides the reset control entirely (the platform-default editor has nothing to "fall back" to). */
  onReset?: () => void;
  isSaving: boolean;
  isResetting?: boolean;
  isOverridden?: boolean;
  /**
   * The platform default's raw text, shown/previewed in place of an
   * empty `value` — a school with no override still actually sends
   * this, so an empty editor must not preview as "nothing will be
   * sent." Undefined for the platform-default editor itself (nothing to
   * fall back to there).
   */
  fallbackText?: string | null;
  schoolNameForPreview: string;
  licenseExpired: boolean;
  helperText: string;
}

export function SmsTemplateEditor({
  label,
  value,
  onChange,
  onSave,
  onReset,
  isSaving,
  isResetting,
  isOverridden,
  fallbackText,
  schoolNameForPreview,
  licenseExpired,
  helperText,
}: SmsTemplateEditorProps) {
  const isUsingFallback = value.trim() === '' && Boolean(fallbackText);
  const textForPreview = isUsingFallback ? (fallbackText ?? '') : value;

  // Segment/cost math runs against the INTERPOLATED text, not the raw
  // template with its literal {student_name} etc. tokens still in it —
  // a real send never contains those tokens, and a real name/school/time
  // is very rarely the same length as its placeholder, so measuring the
  // raw template would misreport the actual per-send cost.
  const preview = useMemo(
    () => interpolate(textForPreview, schoolNameForPreview),
    [textForPreview, schoolNameForPreview],
  );
  const segmentInfo = useMemo(() => calculateSmsSegments(preview), [preview]);

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{label}</h4>
        {isOverridden !== undefined && (
          <Badge variant={isOverridden ? 'default' : 'outline'}>
            {isOverridden ? 'Custom' : 'Using platform default'}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{helperText}</p>

      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={fallbackText ?? undefined}
        rows={3}
        className="font-mono text-sm"
        dir="auto"
      />
      {isUsingFallback && (
        <button
          type="button"
          className="text-xs text-primary underline underline-offset-2"
          onClick={() => onChange(fallbackText ?? '')}
        >
          Start from the platform default shown above, to customize it
        </button>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Encoding: <span className="font-medium text-foreground">{segmentInfo.encoding}</span>
        </span>
        <span>
          {segmentInfo.length} char{segmentInfo.length === 1 ? '' : 's'}
        </span>
        <span>
          {segmentInfo.segments} SMS segment{segmentInfo.segments === 1 ? '' : 's'}
          {segmentInfo.segments > 0 && ` (~${segmentInfo.segments} credit${segmentInfo.segments === 1 ? '' : 's'})`}
        </span>
        {segmentInfo.encoding === 'Unicode' && (
          <span className="text-amber-700 dark:text-amber-400">
            Devanagari/non-ASCII text always uses Unicode encoding — {segmentInfo.singleSegmentLimit}{' '}
            chars per single SMS instead of the 160 plain-English text gets, so it costs more segments
            sooner than English text of the same length.
          </span>
        )}
      </div>

      <div className="rounded-md border bg-muted/50 p-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          {isUsingFallback ? 'Currently sending (platform default) — ' : 'Preview — '}
          sample: {SAMPLE_PLACEHOLDERS.student_name}, {schoolNameForPreview}, {SAMPLE_PLACEHOLDERS.time}
        </p>
        <p className="text-sm" dir="auto">
          {preview || <span className="italic text-muted-foreground">Empty message</span>}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isSaving || licenseExpired}
          title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
          onClick={onSave}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        {onReset && (
          <Button
            size="sm"
            variant="outline"
            disabled={isResetting || licenseExpired || !isOverridden}
            title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
            onClick={onReset}
          >
            {isResetting ? 'Resetting…' : 'Reset to platform default'}
          </Button>
        )}
      </div>
    </div>
  );
}
