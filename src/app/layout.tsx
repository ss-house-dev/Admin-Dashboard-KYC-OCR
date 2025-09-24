import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppProviders from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kyra Dashboard",
  description: "",
  icons: {
    icon: [{ url: "/favicon.ico?v=2" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ntialiased h-dvh w-full overflow-hidden`}
        data-gramm="false"
        data-gramm_editor="false"
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
