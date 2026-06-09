"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { BarChart3, FileText, ListChecks, LogOut, ScrollText, Waves } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toastService } from "@/lib/toast-service";
import type { ReactNode } from "react";

const primaryNav = [
  { href: "/admin/surveys", label: "Surveys", icon: Waves },
  { href: "questions", label: "Questions", icon: ListChecks },
  { href: "responses", label: "Responses", icon: BarChart3 }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ surveyId?: string }>();
  const surveyId = params.surveyId;
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

  const buildHref = (segment: string) => {
    if (segment === "/admin/surveys") return segment;
    if (!surveyId) return "/admin/surveys";
    return `/admin/surveys/${surveyId}/${segment}`;
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
            const href = buildHref(item.href);
            const active = pathname.startsWith(href);
            const disabled = item.href !== "/admin/surveys" && !surveyId;
            return (
              <Link
                key={item.label}
                href={href}
                aria-disabled={disabled}
                className={cn(
                  "focus-ring flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                  active
                    ? "border-[color:var(--border-active)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)] shadow-[0_0_22px_rgba(13,148,136,0.12)]"
                    : "border-transparent bg-transparent text-[color:var(--text-secondary)] hover:border-[color:var(--border)] hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]",
                  disabled && "pointer-events-none opacity-50"
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
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Selected survey</div>
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
          className="border-b border-[color:var(--border)] bg-[rgba(6,10,9,0.66)] px-4 py-4 backdrop-blur-xl lg:hidden"
          suppressHydrationWarning
        >
          <div className="flex items-center justify-between">
            <Link href="/admin/surveys" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)]">
                <FileText className="h-4 w-4" />
              </span>
              <div className="font-display text-lg text-[color:var(--text-primary)]">Control</div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LogOut className="h-4 w-4" />}
              loading={loggingOut}
              onClick={handleLogout}
            >
              Log out
            </Button>
          </div>
        </div>
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
