'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { HeaderActions } from "@/components/header-actions";
import { getAuthToken } from '@/dash_department/lib/api';
import { NotificationProvider } from "@/contexts/notification-context";
import { NotificationManager } from "@/components/notification-manager";
import { AuthErrorProvider } from "@/contexts/auth-error-context";
import { AuthErrorHandler } from "@/components/auth-error-handler";

export default function StatisticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  return (
    <AuthErrorProvider>
      <NotificationProvider>
        <NotificationManager />
        <AuthErrorHandler />
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="relative flex-1 max-w-[428px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 w-full"
            />
          </div>
          <div className="ml-auto">
            <HeaderActions />
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
      </NotificationProvider>
    </AuthErrorProvider>
  );
}

