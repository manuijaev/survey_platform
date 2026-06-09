"use client";

import { RefreshCw } from "lucide-react";

type UpdateBannerProps = {
  onReload: () => void;
};

export function UpdateBanner({ onReload }: UpdateBannerProps) {
  return (
    <div className="fixed left-0 right-0 top-0 z-[60] border-b border-[color:var(--border-active)] bg-[rgba(6,10,9,0.92)] px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
          <RefreshCw className="h-4 w-4 text-[color:var(--primary)]" />
          <span>A new version of SkyWorld is ready.</span>
        </div>
        <button
          type="button"
          onClick={onReload}
          className="focus-ring shrink-0 rounded-full border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.18)] px-4 py-1.5 text-sm text-[color:var(--text-primary)] transition hover:bg-[rgba(13,148,136,0.28)]"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
