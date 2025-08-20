'use client'
import * as React from 'react';
import { Providers } from './providers'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useNotification } from '@/hooks/useNotification';
import NotificationTest from '@/components/NotificationTest';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "BBS ITH",
//   description: "Behavior Base Safety (BBS)",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { requestPermission } = useNotification();

  React.useEffect(() => {
    // ขอ permission หลังจากผู้ใช้ใช้งานแอปสักครู่
    const timer = setTimeout(() => {
      requestPermission();
    }, 5000);

    return () => clearTimeout(timer);
  }, [requestPermission]);

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/ith.png" />
        <meta name="theme-color" content="#000000" />
        <title>BBS ITH</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <NotificationTest />
        </Providers>
      </body>
    </html>
  );
}
