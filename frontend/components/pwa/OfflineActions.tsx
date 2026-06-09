"use client";

import Link from "next/link";

export function OfflineActions() {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Link
        href="/surveys"
        className="focus-ring rounded-full border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.18)] px-5 py-2.5 text-sm text-[color:var(--text-primary)] transition hover:bg-[rgba(13,148,136,0.28)]"
      >
        Open surveys
      </Link>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="focus-ring rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm text-[color:var(--text-secondary)] transition hover:text-[color:var(--text-primary)]"
      >
        Try again
      </button>
    </div>
  );
}
