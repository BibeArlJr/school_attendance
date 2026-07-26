import * as Sentry from '@sentry/react';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

/**
 * react-router's data routers (createBrowserRouter) already catch any
 * render error thrown by a route and bubble it to the nearest ancestor
 * errorElement — but with none configured, that default is a raw,
 * minified stack trace dumped straight to the page ("Unexpected
 * Application Error!", confirmed live, Prompt 45). This replaces that
 * default with the same "Something went wrong" visual language already
 * used for a failed data fetch (ErrorState), just full-page — a route
 * render crash means there's no reliable app chrome left to embed
 * anything inside.
 *
 * Reports to Sentry (a no-op with no VITE_SENTRY_DSN configured — see
 * shared/lib/sentry.ts) exactly once per crash, not once per re-render.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    Sentry.captureException(error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const description = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "We hit an unexpected error and couldn't continue. Reloading the page usually fixes it.";

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center space-y-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => window.location.assign('/')}>
            Reload
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
