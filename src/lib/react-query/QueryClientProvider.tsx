"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
} from "@tanstack/react-query";
// (option) import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ✅ คีย์สำคัญ: ย้อนหน้ากลับมาแล้วไม่ยิงใหม่
            staleTime: 5 * 60 * 1000,        // 5 นาทีถือว่ายังสด
            gcTime: 30 * 60 * 1000,          // เก็บ cache 30 นาที
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,           // แม้ stale ก็ไม่รีตอน mount (เราตั้ง staleTime อยู่แล้ว)
            placeholderData: keepPreviousData, // pagination ลื่น ไม่กระพริบ
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
