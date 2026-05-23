// app/layout.tsx
import * as React from "react";
import { Providers } from "./providers";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationToggleButton from "@/components/NotificationToggleButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "BBS ITH",
  description: "Behavior Base Safety (BBS)",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/ith.png",
    shortcut: "/icons/ith.png",
    apple: "/icons/ith.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/icons/ith.png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="fixed right-4 z-40 top-[43px] md:top-[10px]">
            <NotificationToggleButton />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
