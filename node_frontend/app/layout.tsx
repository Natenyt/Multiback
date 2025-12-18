import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/hooks/use-toast";
import { StaffProfileProvider } from "@/contexts/staff-profile-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    title: "Narpay Tuman Murojaatlar Portali",
    description: "Narpay tumani aholisi uchun murojaatlarni qabul qilish va boshqarish portali.",
    images: [
      {
        url: "/link-preview-banner.png",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ToastProvider>
            <StaffProfileProvider>
              {children}
            </StaffProfileProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
