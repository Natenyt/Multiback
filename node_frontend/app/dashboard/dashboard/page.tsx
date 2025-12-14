"use client"

import { useEffect, useState } from 'react';
import { Poppins } from 'next/font/google';
import { Button } from "@/components/ui/button";
import { HeaderActions } from "@/components/header-actions";
import { DashboardStats } from "@/components/dashboard-stats";
import { SessionsChart } from "@/components/sessions-chart";
import { DemographicsChart } from "@/components/demographics-chart";
import { NeighborhoodsChart } from "@/components/neighborhoods-chart";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { getStaffProfile } from '@/dash_department/lib/api';
import type { StaffProfileResponse } from '@/dash_department/lib/api';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export default function DashboardPage() {
  const [staffProfile, setStaffProfile] = useState<StaffProfileResponse | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await getStaffProfile();
        setStaffProfile(profile);
      } catch (error) {
        console.error("Failed to fetch staff profile:", error);
      }
    }

    fetchProfile();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between" style={{ paddingLeft: '32px', paddingRight: '16px', paddingTop: '32px', paddingBottom: '32px' }}>
        <p className={`${poppins.className} font-medium`} style={{ fontSize: '30px' }}>
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
      <div className="px-4 pb-4">
        <LeaderboardTable />
      </div>
    </>
  );
}

