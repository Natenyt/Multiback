"use client"

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Poppins } from 'next/font/google';
import { Button } from "@/components/ui/button";
import { HeaderActions } from "@/components/header-actions";
import { DashboardStats } from "@/components/dashboard-stats";
import { SessionsChart } from "@/components/sessions-chart";
import { DemographicsChart } from "@/components/demographics-chart";
import { NeighborhoodsChart } from "@/components/neighborhoods-chart";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { useStaffProfile } from "@/contexts/staff-profile-context";
import { useDashboardStats } from "@/hooks/use-dashboard-data";

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap', // Prevents font blocking and reduces preload warnings
  preload: true, // Explicitly enable preload
});

export default function DashboardPage() {
  const { staffProfile } = useStaffProfile();
  const pathname = usePathname();
  const { refresh } = useDashboardStats();

  // Refresh dashboard stats when navigating to dashboard page
  useEffect(() => {
    if (pathname === '/dashboard/dashboard') {
      refresh();
    }
  }, [pathname, refresh]);

  return (
    <>
      <div className="flex items-center justify-between" style={{ paddingLeft: '32px', paddingRight: '16px', paddingTop: '32px', paddingBottom: '32px' }}>
        <p className={`${poppins.className} font-medium`} style={{ fontSize: '30px' }}>
          Xush kelibsiz!
        </p>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="cursor-default hover:bg-accent hover:text-accent-foreground"
            onClick={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
          >
            {staffProfile?.job_title || '...'}
          </Button>
          {staffProfile?.department_name_uz && (
            <Button 
              variant="outline" 
              className="cursor-default hover:bg-accent hover:text-accent-foreground"
              onClick={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
            >
              {staffProfile.department_name_uz.length > 60 
                ? `${staffProfile.department_name_uz.substring(0, 60)}...` 
                : staffProfile.department_name_uz}
            </Button>
          )}
        </div>
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
      <div className="px-4 pb-4">
        <LeaderboardTable />
      </div>
    </>
  );
}

