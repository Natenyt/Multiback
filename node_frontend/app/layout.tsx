import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/hooks/use-toast";
import { StaffProfileProvider } from "@/contexts/staff-profile-context";
import { Analytics } from "@vercel/analytics/next";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Prevents font blocking and reduces preload warnings
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // Prevents font blocking and reduces preload warnings
});

export const metadata: Metadata = {
  title: "Narpay Tuman Murojaatlar Portali",
  description: "Narpay tumani aholisi uchun murojaatlarni qabul qilish va boshqarish dashboardi.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Narpay Tuman Murojaatlar Portali",
    title: "Narpay Tuman Murojaatlar Portali",
    description: "Narpay tumani aholisi uchun murojaatlarni qabul qilish va boshqarish dashboardi.",
    images: [
      {
        url: "https://yourdomain.com/link-preview-banner.png", // <-- Replace with your deployed URL
        width: 1200,
        height: 630,
        alt: "NTMP - Narpay Tuman Murojaatlar Portali",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="ntmp-theme"
        >
          <ToastProvider>
            <StaffProfileProvider>
              {children}
            </StaffProfileProvider>
          </ToastProvider>
          <Analytics />
        </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
