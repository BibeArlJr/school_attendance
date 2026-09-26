import { useState } from 'react';
import { toast } from 'sonner';
import { useBulkSmsCredential } from '../hooks/useBulkSmsCredential';
import { useBulkSmsCredits } from '../hooks/useBulkSmsCredits';
import { useUpdateBulkSmsCredential } from '../hooks/useUpdateBulkSmsCredential';
import type { BulkSmsProviderConfigInfo } from '../types';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { extractErrorMessage } from '@/shared/lib/errors';

interface CredentialFormProps {
  config?: BulkSmsProviderConfigInfo;
}

/**
 * Local `senderId`/`token` state is only ever initialized once, from
 * `config` at mount — no effect syncing fetched data into state (the
 * parent remounts this via a `key` once the query resolves, React's own
 * recommended pattern for this, instead of a setState-in-an-effect that
 * the React Compiler correctly flags as a cascading-render risk).
 */
function CredentialForm({ config }: CredentialFormProps) {
  const updateCredential = useUpdateBulkSmsCredential();
  const [token, setToken] = useState('');
  const [senderId, setSenderId] = useState(config?.sender_id ?? '');

  function handleSave() {
    if (!token.trim() || !senderId.trim()) {
      return;
    }
    updateCredential.mutate(
      { token: token.trim(), senderId: senderId.trim() },
      {
        onSuccess: () => setToken(''),
        onError: (error) => toast.error(extractErrorMessage(error)),
      },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bulk SMS Sparrow Credential</CardTitle>
        <Badge variant={config?.configured ? 'default' : 'outline'}>
          {config?.configured ? 'Configured' : 'Not configured'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Separate from the attendance system's own Sparrow token — this credential is only ever
          used by the Bulk SMS module's Test SMS tab.
        </p>

        {config?.configured && (
          <div className="rounded-md border bg-muted/50 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Sender ID:</span> {config.sender_id}
            </p>
            <p>
              <span className="text-muted-foreground">Token:</span>{' '}
              <span className="font-mono">{config.masked_token}</span>
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-sms-token">{config?.configured ? 'New token' : 'Token'}</Label>
            <Input
              id="bulk-sms-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder={config?.configured ? 'Enter to replace the current token' : 'Sparrow token'}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bulk-sms-sender-id">Sender ID</Label>
            <Input
              id="bulk-sms-sender-id"
              value={senderId}
              onChange={(event) => setSenderId(event.target.value)}
              placeholder="Approved sender name"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateCredential.isPending || !token.trim() || !senderId.trim()}>
          {updateCredential.isPending ? 'Saving…' : 'Save credential'}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * The Bulk SMS module's OWN Sparrow credential — entirely separate from
 * the attendance system's SMS Provider config (a different table, a
 * different backend service, no shared row). "Check Connection" and
 * "Check Credits" both call the same read-only credit-check endpoint;
 * neither of them, nor anything else on this page, can ever send an
 * SMS — that only exists on the separate "Test SMS" tab.
 */
export function BulkSmsCredentialSection() {
  const credentialQuery = useBulkSmsCredential();
  const credits = useBulkSmsCredits();

  function handleCheck() {
    credits.mutate(undefined, {
      onError: (error) => toast.error(extractErrorMessage(error)),
    });
  }

  if (credentialQuery.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingSkeleton lines={4} />
        </CardContent>
      </Card>
    );
  }

  const config = credentialQuery.data;

  return (
    <div className="space-y-4">
      {/* Keyed on whether a real config was loaded — remounts once
          (never again after) so the form's local state initializes
          from the real sender_id, without an effect. */}
      <CredentialForm key={config ? 'loaded' : 'empty'} config={config} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Both buttons below only check the credit balance — neither ever sends an SMS, under
            mock or real mode.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCheck} disabled={credits.isPending}>
              {credits.isPending ? 'Checking…' : 'Check Connection'}
            </Button>
            <Button variant="outline" onClick={handleCheck} disabled={credits.isPending}>
              {credits.isPending ? 'Checking…' : 'Check Credits'}
            </Button>
          </div>

          {credits.data && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              {credits.data.mock && (
                <Badge variant="outline" className="mb-2">
                  Mock mode — not a real Sparrow response
                </Badge>
              )}
              {credits.data.error ? (
                <p className="text-destructive">{credits.data.error}</p>
              ) : (
                <>
                  <p>
                    <span className="text-muted-foreground">Credits available:</span>{' '}
                    {credits.data.credits_available}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Credits consumed:</span>{' '}
                    {credits.data.credits_consumed}
                  </p>
                </>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Driver: <span className="font-mono">{credits.data.driver}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
