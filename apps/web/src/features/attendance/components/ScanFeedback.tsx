import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, LogIn, LogOut, XCircle } from 'lucide-react';
import type { ScanResult } from '../types';
import { Badge } from '@/shared/components/ui/badge';

interface ScanFeedbackProps {
  scan: ScanResult;
}

function formatTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutesStr} ${period}`;
}

const REJECTION_MESSAGES: Record<string, string> = {
  unknown_barcode: "This barcode isn't registered to any student or staff member.",
  card_inactive: 'This ID card has been deactivated — issue a new card.',
  owner_inactive: 'This record is not active.',
};

function ownerName(scan: ScanResult): string | null {
  if (scan.owner_type === 'staff' && scan.staff) {
    return scan.staff.name;
  }
  if (scan.student) {
    return `${scan.student.first_name} ${scan.student.last_name}`;
  }
  return null;
}

function ownerSubtitle(scan: ScanResult): string {
  if (scan.owner_type === 'staff' && scan.staff) {
    return scan.staff.designation ?? '';
  }
  if (scan.student?.school_class) {
    return `${scan.student.school_class.name}${scan.student.school_class.section ? ` - ${scan.student.school_class.section}` : ''}`;
  }
  return '';
}

export function ScanFeedback({ scan }: ScanFeedbackProps) {
  const name = ownerName(scan);

  if (scan.result === 'duplicate_ignored') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-10 text-center dark:bg-amber-950/40"
      >
        <Clock className="size-16 text-amber-600" />
        <p className="text-2xl font-semibold text-amber-800 dark:text-amber-300">Already scanned</p>
        {name && <p className="text-lg text-amber-700 dark:text-amber-400">{name}</p>}
      </motion.div>
    );
  }

  if (scan.result === 'matched_in' || scan.result === 'matched_out') {
    const isIn = scan.result === 'matched_in';
    const time = isIn ? scan.record?.in_time : scan.record?.out_time;
    const isStaff = scan.owner_type === 'staff';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-10 text-center dark:bg-emerald-950/40"
      >
        {isIn ? (
          <LogIn className="size-16 text-emerald-600" />
        ) : (
          <LogOut className="size-16 text-emerald-600" />
        )}
        <p className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300">
          {isIn ? 'Entered' : 'Left'}
        </p>
        {name && (
          <>
            <p className="text-xl font-medium text-emerald-900 dark:text-emerald-200">{name}</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">{ownerSubtitle(scan)}</p>
          </>
        )}
        {time && (
          <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
            {formatTime(time)}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {scan.record?.late && <Badge variant="secondary">Late</Badge>}
          {scan.record?.early_departure && <Badge variant="secondary">Early departure</Badge>}
          {scan.needs_review && <Badge variant="outline">Flagged for review</Badge>}
        </div>
        {/* Staff scans have no parent to notify — the SMS tag only applies
            to student scans. */}
        {!isStaff && (
          <Badge className="mt-1 gap-1">
            <CheckCircle2 className="size-3" />
            {scan.sms_sent ? 'SMS sent' : 'No guardian on file'}
          </Badge>
        )}
      </motion.div>
    );
  }

  // Rejections: unknown_barcode, card_inactive, owner_inactive
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-3 rounded-2xl border-2 border-destructive bg-destructive/10 p-10 text-center"
    >
      <XCircle className="size-16 text-destructive" />
      <p className="text-2xl font-semibold text-destructive">Scan rejected</p>
      {name && <p className="text-lg text-destructive">{name}</p>}
      <p className="max-w-sm text-sm text-destructive/80">
        {REJECTION_MESSAGES[scan.result] ?? 'This scan could not be processed.'}
      </p>
      {scan.needs_review && (
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="size-3" />
          Logged for review
        </Badge>
      )}
    </motion.div>
  );
}
