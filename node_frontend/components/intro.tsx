'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAuthToken } from '@/dash_department/lib/api';

/**
 * Intro Component
 * 
 * Displays a professional intro screen with:
 * - NTMP logo appears first with slow fade-in (0.8s) and optional scale (98% → 100%)
 * - Text appearing 0.3s after logo appears (not after animation starts)
 * - Total duration: 5 seconds (within 4-6 second range)
 * - Pure black background (#000000) - locked regardless of user theme preference
 * - No audio (silent, professional)
 */
export default function Intro() {
  const router = useRouter();
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [logoScale, setLogoScale] = useState(0.98);
  const [textOpacity, setTextOpacity] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Force dark theme for intro (locked, won't change even if user has light theme)
    // This ensures consistent dark background for intro and login pages
    document.documentElement.classList.add('dark');
    
    // Logo appears first: fade-in animation (0.8s) from opacity 0 → 100
    // Optional slight scale from 98% → 100%
    const logoTimer = setTimeout(() => {
      setLogoOpacity(1);
      setLogoScale(1);
    }, 100); // Small delay to ensure smooth animation start

    // Text appears 0.3s AFTER logo appears (not after animation starts)
    // Logo animation is 0.8s, so text appears at: 100ms (start) + 800ms (logo animation) + 300ms (delay) = 1200ms
    const textTimer = setTimeout(() => {
      setTextOpacity(1);
    }, 100 + 800 + 300); // Start delay + logo animation duration + 0.3s delay after logo appears

    // Total intro duration: 5 seconds (within 4-6 second range)
    // After intro completes, redirect to login or dashboard
    const redirectTimer = setTimeout(() => {
      setShowIntro(false);
      const token = getAuthToken();
      if (token) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, 5000); // 5 seconds total

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  if (!showIntro) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ 
        backgroundColor: '#000000', // Pure black background - locked, won't change
      }}
    >
      {/* Logo: Appears first, fade-in (0.8s) with optional scale (98% → 100%) */}
      {/* No rotation, no bounce - just smooth fade and subtle scale */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        }}
        className="mb-6"
      >
        <Image
          src="/logo.svg"
          alt="NTMP Logo"
          width={120}
          height={120}
          className="object-contain"
          priority
        />
      </div>

      {/* Text: Appears 0.3s after logo appears, bigger text size */}
      <div
        style={{
          opacity: textOpacity,
          transition: 'opacity 0.6s ease-out',
        }}
        className="text-center"
      >
        <h1 
          className="text-3xl font-semibold mb-3"
          style={{ color: '#ffffff' }} // White color
        >
          NTMP
        </h1>
        <p 
          className="text-base"
          style={{ color: '#ffffff' }} // White color
        >
          Raqamli murojaatlar boshqaruv tizimi
        </p>
      </div>
    </div>
  );
}

