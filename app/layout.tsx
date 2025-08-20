// app/layout.tsx (ลบ 'use client')
import * as React from "react";
import { Providers } from "./providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotificationManager from "@/components/NotificationManager";
import MobileNotificationButton from '@/components/MobileNotificationButton';
import AndroidNotificationFix from '@/components/AndroidNotificationFix';
import AndroidTest from '@/components/AndroidTest';
import AutoWelcomeNotification from '@/components/AutoWelcomeNotification';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BBS ITH",
  description: "Behavior Base Safety (BBS)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/ith.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ErrorBoundary>
            <NotificationManager />
          </ErrorBoundary>
          <AutoWelcomeNotification />
          {children}
        </Providers>
      </body>
    </html>
  );
}
