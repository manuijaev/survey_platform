"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { BackendWarmup } from "@/components/BackendWarmup";
import { PwaProvider } from "@/components/pwa/PwaProvider";
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
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000)
          },
          mutations: {
            retry: 0
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PwaProvider>
        <BackendWarmup />
        <ToastProvider>{children}</ToastProvider>
      </PwaProvider>
      <DevTools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
