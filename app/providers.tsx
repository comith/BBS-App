"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { NotificationLogProvider } from '@/contexts/NotificationLogContext';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 นาที
            gcTime: 10 * 60 * 1000, // 10 นาที
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: true,
            refetchInterval: false,
            refetchIntervalInBackground: false,
            retry: 2,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* ✅ ครอบด้วย NotificationLogProvider */}
      {/* <NotificationLogProvider 
        refreshInterval={30000}  // รีเฟรชทุก 30 วินาที
        enableRealtime={true}    // เปิดใช้ real-time updates
      >
        {children}
      </NotificationLogProvider> */}
       {children}
      
      {/* แสดง DevTools เฉพาะใน development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}