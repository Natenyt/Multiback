'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getAuthToken } from '@/dash_department/lib/api';
import { NotificationProvider } from "@/contexts/notification-context";
import { NotificationManager } from "@/components/notification-manager";
import { AuthErrorProvider } from "@/contexts/auth-error-context";
import { AuthErrorHandler } from "@/components/auth-error-handler";

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Check if current route is a case detail page
  const isCaseDetailPage = pathname?.match(/^\/train\/[^/]+$/) !== null;

  return (
    <AuthErrorProvider>
      <NotificationProvider>
        <NotificationManager />
        <AuthErrorHandler />
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* No header for training workspace */}
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
      </NotificationProvider>
    </AuthErrorProvider>
  );
}

