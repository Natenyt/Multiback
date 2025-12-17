'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '../dash_department/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Debug: Log environment variable (remove after debugging)
    if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
      console.log('BACKEND_PRIVATE_URL:', process.env.BACKEND_PRIVATE_URL);
    }
    
    const token = getAuthToken();
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p>Redirecting...</p>
    </div>
  );
}
