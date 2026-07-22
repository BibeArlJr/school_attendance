import { UserRound } from 'lucide-react';
import type { IdCard } from '../types';
import { BarcodeImage } from './BarcodeImage';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';

interface IdCardViewProps {
  card: IdCard;
  schoolName: string;
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
export function IdCardView({ card, schoolName }: IdCardViewProps) {
  // This view is only ever fed a card from useStudentIdCard (the
  // per-student endpoint), which structurally only returns owner_type
  // 'student' cards — `student` is never null in practice here, even
  // though the shared IdCard type also covers staff cards.
  const student = card.student!;

  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border-2 bg-card p-5 shadow-sm print:border print:shadow-none">
      <div className="text-center">
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
          <p className="text-sm text-muted-foreground">Admission No. {student.admission_no}</p>
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

      {/* Fixed white, not theme-aware: a barcode needs light background +
          dark bars to stay scannable, both on paper and in dark mode. */}
      <div className="mt-4 flex justify-center rounded-md bg-white p-2">
        <BarcodeImage value={card.barcode_value} />
      </div>
    </div>
  );
}
