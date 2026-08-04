import { UserRound } from 'lucide-react';
import type { IdCard } from '../types';
import { BarcodeImage } from './BarcodeImage';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { formatBsDate, parseBsDateString } from '@/shared/lib/bikramSambat';

/** The ID card only ever has dob_bs (already a BS string, e.g. from
 *  import) available, not the AD `dob` — this just pretty-prints it
 *  ("Ashadh 15, 2070 BS") instead of showing the bare "2070-03-15",
 *  which read as an ordinary (and confusingly futuristic-looking)
 *  Gregorian date with no indication it's actually Bikram Sambat
 *  (Prompt 30 UI/UX audit). */
function formatCardDob(dobBs: string | null): string {
  if (!dobBs) return '—';
  return formatBsDate(parseBsDateString(dobBs));
}

interface IdCardViewProps {
  card: IdCard;
  schoolName: string;
  schoolLogoUrl?: string | null;
}

const STATUS_VARIANT: Record<IdCard['status'], 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  lost: 'outline',
  deactivated: 'secondary',
};

/**
 * The actual printable card. Kept print-friendly by staying a plain,
 * self-contained block — app chrome (sidebar/topbar) is hidden via
 * `print:hidden` on AppShell itself, not anything in here.
 */
export function IdCardView({ card, schoolName, schoolLogoUrl }: IdCardViewProps) {
  // This view is only ever fed a card from useStudentIdCard (the
  // per-student endpoint), which structurally only returns owner_type
  // 'student' cards — `student` is never null in practice here, even
  // though the shared IdCard type also covers staff cards.
  const student = card.student!;

  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border-2 bg-card p-5 shadow-sm print:border print:shadow-none">
      <div className="flex flex-col items-center text-center">
        {schoolLogoUrl && (
          <img src={schoolLogoUrl} alt="" className="mb-1 size-10 object-contain" />
        )}
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {schoolName}
        </p>
        <p className="text-xs text-muted-foreground">Student ID Card</p>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Avatar size="lg" className="size-16">
          <AvatarFallback>
            <UserRound className="size-8" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">
            {student.first_name} {student.last_name}
          </p>
          <p className="text-sm text-muted-foreground">
            {student.school_class
              ? `${student.school_class.name}${student.school_class.section ? ` - ${student.school_class.section}` : ''}`
              : '—'}
          </p>
        </div>
      </div>

      {card.status !== 'active' && (
        <div className="mt-3">
          <Badge variant={STATUS_VARIANT[card.status]} className="capitalize">
            {card.status}
          </Badge>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <span className="text-muted-foreground">Roll No.</span>
        <span>{student.roll_no ?? '—'}</span>

        <span className="text-muted-foreground">Class</span>
        <span>
          {student.school_class
            ? `${student.school_class.name}${student.school_class.section ? ` - ${student.school_class.section}` : ''}`
            : '—'}
        </span>

        <span className="text-muted-foreground">Date of Birth</span>
        <span>{formatCardDob(student.dob_bs)}</span>

        <span className="text-muted-foreground">Guardian</span>
        <span>{student.guardian?.name ?? '—'}</span>

        <span className="text-muted-foreground">Phone</span>
        <span>{student.guardian?.phone ?? '—'}</span>
      </div>

      {/* Fixed white, not theme-aware: a QR code needs light background +
          dark modules to stay scannable, both on paper and in dark mode.
          A QR code is square, unlike Code128's wide/short shape, so this
          no longer needs the -mx-5 edge-to-edge bleed or asymmetric
          left/right quiet zone the linear barcode required — a plain
          centered box with normal padding is enough room. */}
      <div className="mt-4 flex justify-center rounded-md bg-white py-3">
        <BarcodeImage value={card.barcode_value} size={120} />
      </div>
    </div>
  );
}
