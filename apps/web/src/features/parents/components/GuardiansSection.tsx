import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useStudentGuardians } from '../hooks/useStudentGuardians';
import { useUnlinkGuardian } from '../hooks/useUnlinkGuardian';
import type { StudentGuardianLink } from '../types';
import { AddGuardianDialog } from './AddGuardianDialog';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { LICENSE_EXPIRED_MESSAGE } from '@/shared/hooks/useLicenseExpired';

const RELATION_LABEL: Record<StudentGuardianLink['relation'], string> = {
  father: 'Father',
  mother: 'Mother',
  guardian: 'Guardian',
  other: 'Other',
};

interface GuardiansSectionProps {
  studentId: string;
  licenseExpired: boolean;
}

export function GuardiansSection({ studentId, licenseExpired }: GuardiansSectionProps) {
  const guardiansQuery = useStudentGuardians(studentId);
  const unlinkGuardian = useUnlinkGuardian(studentId);
  const [addOpen, setAddOpen] = useState(false);
  // Remounts AddGuardianDialog fresh on every open (rather than resetting
  // its internal phone/search/form state via an effect keyed on `open`,
  // which would call setState synchronously in an effect body).
  const [addDialogKey, setAddDialogKey] = useState(0);
  const [pendingUnlink, setPendingUnlink] = useState<StudentGuardianLink | null>(null);

  function confirmUnlink() {
    if (!pendingUnlink) {
      return;
    }
    void unlinkGuardian.mutateAsync(pendingUnlink.parent.uuid).then(() => setPendingUnlink(null));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Guardians</CardTitle>
        <Button
          size="sm"
          disabled={licenseExpired}
          title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
          onClick={() => {
            setAddDialogKey((key) => key + 1);
            setAddOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Guardian
        </Button>
      </CardHeader>
      <CardContent>
        {guardiansQuery.isLoading ? (
          <LoadingSkeleton lines={3} />
        ) : !guardiansQuery.data || guardiansQuery.data.length === 0 ? (
          <EmptyState title="No guardians linked yet" />
        ) : (
          <ul className="divide-y">
            {guardiansQuery.data.map((link) => (
              <li key={link.link_id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{link.parent.name}</span>
                    <Badge variant="outline" className="capitalize">
                      {RELATION_LABEL[link.relation]}
                    </Badge>
                    {link.is_primary_contact && <Badge>Primary contact</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {link.parent.phone}
                    {link.parent.email ? ` · ${link.parent.email}` : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={licenseExpired}
                  title={licenseExpired ? LICENSE_EXPIRED_MESSAGE : undefined}
                  onClick={() => setPendingUnlink(link)}
                >
                  Unlink
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <AddGuardianDialog key={addDialogKey} open={addOpen} onOpenChange={setAddOpen} studentId={studentId} />

      <Dialog open={pendingUnlink !== null} onOpenChange={(next) => !next && setPendingUnlink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink guardian?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes {pendingUnlink?.parent.name} as a guardian for this student. Their contact
            record itself is not deleted, and any other linked students are unaffected.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingUnlink(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmUnlink} disabled={unlinkGuardian.isPending}>
              {unlinkGuardian.isPending ? 'Unlinking…' : 'Unlink'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
