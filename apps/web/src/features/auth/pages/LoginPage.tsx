import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginFormValues } from '../schema';
import { useAuthStore } from '../store/authStore';
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
import { extractErrorMessage } from '@/shared/lib/errors';

export default function LoginPage() {
  const login = useLogin();
  // Last-known branding for whichever school this browser last operated
  // as (survives logout, unlike the rest of authStore) — lets the
  // pre-auth screen still show that school's own logo instead of a
  // generic one, without ever needing to know which school is logging
  // in before credentials are submitted.
  const logoUrl = useAuthStore((state) => state.branding?.logo_url);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(values: LoginFormValues) {
    login.mutate(values);
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center space-y-2 text-center">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="size-12 rounded-xl object-contain" />
          ) : (
            // Platform-level branding (Prompt 53) — shown only when no
            // specific school's own logo is already known for this
            // browser (the logoUrl branch above, untouched).
            <img
              src="/branding/icon-512.png"
              alt=""
              className="size-12 rounded-xl object-contain"
            />
          )}
          <CardTitle className="text-xl">School Attendance System</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to your school's dashboard</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="username"
                        placeholder="admin@demo-school.edu.np"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {login.isError && (
                <p className="text-sm text-destructive" role="alert">
                  {extractErrorMessage(login.error)}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
