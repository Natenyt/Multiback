'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/dash_department/lib/api';

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
    
    // Ensure theme is restored from localStorage after navigation from login
    const savedTheme = localStorage.getItem('ntmp-theme');
    if (savedTheme) {
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center">
      {children}
    </div>
  );
}



