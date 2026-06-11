"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Settings2, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const navItems = [
  { href: "/surveys", label: "Surveys", icon: Waves },
  { href: "/admin/login", label: "Admin", icon: Settings2 }
];

export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRespondFlow = /\/respond\/?$/.test(pathname);
  const compactHeader = isRespondFlow;

  return (
    <div className="min-h-screen">
      <header
        className={cn(
          "app-header sticky top-0 z-40 border-b border-[color:var(--border)] bg-[rgba(6,10,9,0.88)] backdrop-blur-xl",
          compactHeader && "hidden sm:block"
        )}
      >
        <div className="app-header-inner mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/surveys" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)] shadow-[0_0_24px_rgba(13,148,136,0.14)]">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-display text-lg text-[color:var(--text-primary)] sm:text-xl">SkyWorld</div>
              <div className="hidden text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)] sm:block">
                Survey Platform
              </div>
            </div>
          </Link>
          <nav className="flex shrink-0 items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "app-nav-btn focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm transition sm:px-4",
                    active
                      ? "border-[color:var(--border-active)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)] shadow-[0_0_22px_rgba(13,148,136,0.12)]"
                      : "border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-active)] hover:text-[color:var(--text-primary)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
