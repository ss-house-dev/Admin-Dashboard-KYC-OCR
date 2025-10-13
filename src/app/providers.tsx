"use client";

import { SessionProvider } from "next-auth/react";
import QueryProvider from "@/lib/react-query/QueryClientProvider";
import { Toaster } from "sonner";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>{children}</QueryProvider>
      <Toaster position="top-right" richColors closeButton />
    </SessionProvider>
  );
}
