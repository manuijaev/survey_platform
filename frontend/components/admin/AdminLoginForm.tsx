"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, ScrollText, Waves } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toastService } from "@/lib/toast-service";

export function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        toastService.error("Sign in failed", data?.message ?? "Check your credentials and try again.");
        return;
      }

      toastService.success("Welcome back", "Admin dashboard unlocked.");
      router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin/surveys");
      router.refresh();
    } catch {
      toastService.error("Sign in failed", "Unable to reach the auth service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--bg-base)]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(13,148,136,0.16), transparent 34%), radial-gradient(circle at 80% 0%, rgba(56,189,248,0.08), transparent 28%)"
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/surveys" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)]">
              <Waves className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-xl text-[color:var(--text-primary)]">SkyWorld</div>
              <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
                Candidate surveys
              </div>
            </div>
          </Link>
          <Link
            href="/surveys"
            className="focus-ring rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-active)] hover:text-[color:var(--text-primary)]"
          >
            Back to surveys
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md rounded-[2rem] border border-[color:var(--glass-border)] bg-[rgba(12,20,16,0.82)] p-6 shadow-[0_32px_96px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)] shadow-[0_0_28px_rgba(13,148,136,0.16)]">
                <ScrollText className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Admin access</p>
                <h1 className="font-display text-3xl text-[color:var(--text-primary)]">Control login</h1>
              </div>
            </div>

            <p className="mb-6 text-sm leading-6 text-[color:var(--text-secondary)]">
              Sign in to manage surveys, review responses, and curate your talent vault.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="admin"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                leftIcon={<LockKeyhole className="h-4 w-4" />}
              >
                Sign in to dashboard
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
