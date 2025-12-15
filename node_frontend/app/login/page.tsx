'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  useFormField,
} from '@/components/ui/form';
import { staffLogin, storeAuthTokens } from '../../dash_department/lib/api';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Please fill out this field.'),
  password: z.string().min(1, 'Please fill out this field.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Custom error tooltip component matching the design
function CustomFormMessage({
  shouldShow
}: {
  shouldShow: boolean
}) {
  const { error, formMessageId } = useFormField();

  if (!error || !shouldShow) {
    return null;
  }

  return (
    <div
      id={formMessageId}
      className="relative mt-2"
    >
      {/* Tooltip with arrow */}
      <div className="relative bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-md shadow-lg">
        {/* Arrow pointing up */}
        <div className="absolute -top-2 left-4 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#2a2a2a]"></div>

        {/* Content */}
        <div className="flex items-center gap-2">
          {/* Orange square icon with exclamation */}
          <div className="w-4 h-4 bg-[#ff9500] rounded flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-3 h-3 text-white" />
          </div>
          <span>{error.message || 'Please fill out this field.'}</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Force dark theme on login page - locked to dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    // Keep dark theme locked - don't remove on unmount
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await staffLogin(data);
      storeAuthTokens(response.access, response.refresh);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const { isSubmitted, errors } = form.formState;
  const identifierError = errors.identifier;
  const passwordError = errors.password;

  // - If email is empty (even if both are empty): show email tooltip
  // - If password is empty BUT email is filled: show password tooltip
  const showIdentifierTooltip = isSubmitted && !!identifierError;
  const showPasswordTooltip = isSubmitted && !!passwordError && !identifierError;

  return (
    <div className="dark flex min-h-screen items-center justify-center" style={{ backgroundColor: 'oklch(0.145_0_0)' }}>
      <Card className="w-full max-w-md bg-[oklch(0.205_0_0)] text-[oklch(0.985_0_0)] border-[oklch(1_0_0_/_10%)]">
        <CardHeader>
          <CardTitle className="text-[oklch(0.985_0_0)]">Login</CardTitle>
          <CardDescription className="text-[oklch(0.708_0_0)]">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username or Email</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter username or email"
                        {...field}
                        disabled={isLoading}
                        autoComplete="username"
                      />
                    </FormControl>
                    <CustomFormMessage shouldShow={showIdentifierTooltip} />
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
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <CustomFormMessage shouldShow={showPasswordTooltip} />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-end">
                <a
                  href="https://t.me/nathan_2net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              {error && (
                <div className="text-sm text-[oklch(0.704_0.191_22.216)]">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-[oklch(0.708_0_0)]">
            Don't have an account?{' '}
            <a
              href="https://t.me/nathan_2net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              Contact Superuser
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

