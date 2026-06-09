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

  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--border)] bg-[rgba(6,10,9,0.62)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/surveys" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)] shadow-[0_0_24px_rgba(13,148,136,0.14)]">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-xl text-[color:var(--text-primary)]">SkyWorld</div>
              <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Survey Platform</div>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                    active
                      ? "border-[color:var(--border-active)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)] shadow-[0_0_22px_rgba(13,148,136,0.12)]"
                      : "border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-active)] hover:text-[color:var(--text-primary)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
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
