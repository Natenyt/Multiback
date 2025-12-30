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
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center">
      {children}
    </div>
  );
}



