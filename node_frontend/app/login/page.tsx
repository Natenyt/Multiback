'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  identifier: z.string().min(1, 'Iltimos, maydonni to\'ldiring.'),
  password: z.string().min(1, 'Iltimos, maydonni to\'ldiring.'),
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
          <span>{error.message || 'Iltimos, maydonni to\'ldiring.'}</span>
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
  // Prevents theme switching even on page refresh
  useEffect(() => {
    // Immediately add dark class
    document.documentElement.classList.add('dark');
    
    // Watch for any theme changes and force dark theme back
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const htmlElement = document.documentElement;
          if (!htmlElement.classList.contains('dark')) {
            // If dark class was removed, add it back immediately
            htmlElement.classList.add('dark');
          }
        }
      });
    });
    
    // Start observing the html element for class changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    // Also set up a periodic check as backup (in case MutationObserver misses something)
    const intervalId = setInterval(() => {
      if (!document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
      }
    }, 100); // Check every 100ms
    
    // Cleanup on unmount
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
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
      
      // Dispatch custom event to notify StaffProfileProvider that token is set
      // This ensures the profile loads immediately after login
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-token-set'));
      }
      
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
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-[oklch(0.985_0_0)] text-center">Kirish</CardTitle>
          <CardDescription className="text-[oklch(0.708_0_0)] text-center">Accountigizga kirish uchun ma'lumotlaringizni kiriting</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foydalanuvchi nomi yoki Email</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Foydalanuvchi nomi yoki email kiriting"
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
                    <FormLabel>Parol</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Parolingizni kiriting"
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
                  Parolni unutdingizmi?
                </a>
              </div>
              {error && (
                <div className="text-sm text-[oklch(0.704_0.191_22.216)]">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Kirilmoqda...' : 'Kirish'}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-[oklch(0.708_0_0)]">
            Account yo'qmi?{' '}
            <a
              href="https://t.me/nathan_2net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              Superuser bilan bog'lanish
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

