"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/ToastProvider";

// Must be client-only — renders different HTML on server vs browser
const DevTools = dynamic(
  () => import("@tanstack/react-query-devtools").then((mod) => ({ default: mod.ReactQueryDevtools })),
  { ssr: false }
);

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1
          },
          mutations: {
            retry: 0
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
      <DevTools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
