import { OfflineActions } from "@/components/pwa/OfflineActions";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)] shadow-[0_0_28px_rgba(13,148,136,0.16)]">
        <WifiOff className="h-8 w-8" />
      </span>
      <h1 className="font-display text-3xl text-[color:var(--text-primary)]">You are offline</h1>
      <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        SkyWorld needs a network connection for live surveys and admin tools. Cached pages may still be
        available once you reconnect.
      </p>
      <OfflineActions />
    </div>
  );
}
