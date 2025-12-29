'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAuthToken } from '@/dash_department/lib/api';

/**
 * Intro Component
 * 
 * Displays a professional intro screen with:
 * - NTMP logo with slow fade-in (0.8s) and optional scale (98% → 100%)
 * - Text appearing after logo with 0.3s delay
 * - Total duration: 5 seconds (within 4-6 second range)
 * - Dark background (#0E1116) - locked regardless of user theme preference
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
    
    // Logo fade-in animation: very slow fade (0.8s) from opacity 0 → 100
    // Optional slight scale from 98% → 100%
    const logoTimer = setTimeout(() => {
      setLogoOpacity(1);
      setLogoScale(1);
    }, 100); // Small delay to ensure smooth animation start

    // Text fade-in animation: appears after logo with 0.3s delay
    // Text starts fading in 0.3s after logo animation begins
    const textTimer = setTimeout(() => {
      setTextOpacity(1);
    }, 100 + 300); // Initial delay + 0.3s delay after logo

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
        backgroundColor: '#0E1116', // Dark neutral background - locked, won't change
      }}
    >
      {/* Logo: Very slow fade-in (0.8s) with optional scale (98% → 100%) */}
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

      {/* Text: Appears under logo with small spacing, fades in after 0.3s delay */}
      <div
        style={{
          opacity: textOpacity,
          transition: 'opacity 0.6s ease-out',
        }}
        className="text-center"
      >
        <h1 
          className="text-2xl font-semibold mb-2"
          style={{ color: '#ffffff' }} // White color
        >
          NTMP
        </h1>
        <p 
          className="text-sm"
          style={{ color: '#ffffff' }} // White color
        >
          Raqamli murojaatlar boshqaruv tizimi
        </p>
      </div>
    </div>
  );
}

