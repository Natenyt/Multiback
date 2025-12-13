'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Poppins } from 'next/font/google';
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HeaderActions } from "@/components/header-actions";
import { DashboardStats } from "@/components/dashboard-stats";
import { SessionsChart } from "@/components/sessions-chart";
import { DemographicsChart } from "@/components/demographics-chart";
import { NeighborhoodsChart } from "@/components/neighborhoods-chart";
import { getAuthToken, getStaffProfile } from '@/dash_department/lib/api';
import type { StaffProfileResponse } from '@/dash_department/lib/api';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [staffProfile, setStaffProfile] = useState<StaffProfileResponse | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    async function fetchProfile() {
      try {
        const profile = await getStaffProfile();
        setStaffProfile(profile);
      } catch (error) {
        console.error("Failed to fetch staff profile:", error);
      }
    }

    fetchProfile();
  }, [router]);

  return (
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
        <div className="py-3 flex items-center justify-between" style={{ paddingLeft: '32px', paddingRight: '16px' }}>
          <p className={`${poppins.className} font-medium`} style={{ fontSize: '26px' }}>
            Xush kelibsiz!
          </p>
          <Button 
            variant="outline" 
            className="cursor-default hover:bg-accent hover:text-accent-foreground"
            onClick={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
          >
            {staffProfile?.job_title || '...'}
          </Button>
        </div>
        <div className="py-4">
          <DashboardStats />
        </div>
        <div className="px-4 pb-4">
          <SessionsChart />
        </div>
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DemographicsChart />
          <NeighborhoodsChart />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

