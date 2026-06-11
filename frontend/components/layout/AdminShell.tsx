"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileText, ListChecks, LogOut, ScrollText, Waves } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toastService } from "@/lib/toast-service";
import type { ReactNode } from "react";

const primaryNav = [
  { href: "/admin/surveys", label: "Surveys", icon: Waves },
  { href: "/admin/questions", label: "Questions", icon: ListChecks },
  { href: "/admin/responses", label: "Responses", icon: BarChart3 }
] as const;

function getSurveyIdFromPath(pathname: string) {
  const match = pathname.match(/\/admin\/surveys\/([^/]+)\/(questions|responses)/);
  return match?.[1];
}

function isNavActive(pathname: string, href: string) {
  if (href === "/admin/surveys") {
    return pathname === "/admin/surveys";
  }
  if (href === "/admin/questions") {
    return pathname.startsWith("/admin/questions") || /\/surveys\/[^/]+\/questions/.test(pathname);
  }
  if (href === "/admin/responses") {
    return pathname.startsWith("/admin/responses") || /\/surveys\/[^/]+\/responses/.test(pathname);
  }
  return pathname.startsWith(href);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const surveyId = useMemo(() => getSurveyIdFromPath(pathname), [pathname]);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toastService.success("Signed out", "Returning to the candidate survey dashboard.");
      router.replace("/surveys");
      router.refresh();
    } catch {
      toastService.error("Sign out failed", "Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen lg:flex" suppressHydrationWarning>
      <aside
        className="glass-panel sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-l-0 border-t-0 border-b-0 border-r border-[color:var(--glass-border)] bg-[rgba(12,20,16,0.82)] px-4 py-5 lg:flex"
        suppressHydrationWarning
      >
        <Link href="/admin/surveys" className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)] shadow-[0_0_24px_rgba(13,148,136,0.14)]">
            <ScrollText className="h-5 w-5" />
          </span>
          <div>
            <div className="font-display text-xl text-[color:var(--text-primary)]">Control</div>
            <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Admin shell</div>
          </div>
        </Link>

        <nav className="space-y-2">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "focus-ring flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                  active
                    ? "border-[color:var(--border-active)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)] shadow-[0_0_22px_rgba(13,148,136,0.12)]"
                    : "border-transparent bg-transparent text-[color:var(--text-secondary)] hover:border-[color:var(--border)] hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {surveyId ? (
          <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Active survey</div>
            <div className="mt-2 font-mono text-sm text-[color:var(--text-primary)]">{surveyId}</div>
          </div>
        ) : null}

        <div className="mt-auto space-y-3">
          <Button
            variant="outline"
            className="w-full"
            leftIcon={<LogOut className="h-4 w-4" />}
            loading={loggingOut}
            onClick={handleLogout}
          >
            Log out to surveys
          </Button>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[rgba(13,148,136,0.08)] p-4">
            <div className="text-sm font-medium text-[color:var(--text-primary)]">Live backend</div>
            <div className="mt-1 text-sm text-[color:var(--text-secondary)]">http://localhost:8080</div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1" suppressHydrationWarning>
        <div
          className="border-b border-[color:var(--border)] bg-[rgba(6,10,9,0.66)] px-4 py-3 backdrop-blur-xl lg:hidden"
          suppressHydrationWarning
        >
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin/surveys" className="flex min-w-0 items-center gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)]">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate font-display text-lg text-[color:var(--text-primary)]">Control</div>
                {surveyId ? (
                  <div className="truncate font-mono text-[11px] text-[color:var(--text-muted)]">{surveyId}</div>
                ) : null}
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LogOut className="h-4 w-4" />}
              loading={loggingOut}
              onClick={handleLogout}
            >
              <span className="sr-only sm:not-sr-only">Log out</span>
            </Button>
          </div>
        </div>

        <nav
          className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[rgba(6,10,9,0.88)] px-2 py-2 backdrop-blur-xl lg:hidden"
          aria-label="Admin navigation"
        >
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition",
                    active
                      ? "border-[color:var(--border-active)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)]"
                      : "border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="min-h-screen pb-4 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
