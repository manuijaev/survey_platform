"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Play, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSurvey } from "@/lib/hooks";
import { formatDateTime } from "@/lib/utils";

export default function SurveyDetailPage() {
  const params = useParams<{ surveyId: string }>();
  const router = useRouter();
  const surveyId = params.surveyId;
  const surveyQuery = useSurvey(surveyId);
  const survey = surveyQuery.data ?? null;

  if (surveyQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title="Survey not found"
          description="The survey you requested does not exist or is no longer available."
          actionLabel="Back to surveys"
          onAction={() => router.push("/surveys")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/surveys"
          className="focus-ring inline-flex min-h-11 items-center gap-2 self-start text-sm text-[color:var(--text-secondary)] transition hover:text-[color:var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to surveys
        </Link>
        <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Public survey</div>
      </div>

      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[rgba(12,20,16,0.9)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
        <div className="space-y-4">
          <div className="text-sm uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Survey landing</div>
          <h1 className="survey-name survey-name--lg">{survey.name}</h1>
          <p className="max-w-2xl text-lg leading-8 text-[color:var(--text-secondary)]">
            {survey.description || "This survey is ready to receive thoughtful responses."}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
            <Users className="h-5 w-5 text-[color:var(--primary)]" />
            <div className="mt-3 text-sm text-[color:var(--text-secondary)]">Responses received</div>
            <div className="mt-1 font-mono text-2xl text-[color:var(--text-primary)]">{survey.responseCount}</div>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
            <ShieldCheck className="h-5 w-5 text-[color:var(--accent)]" />
            <div className="mt-3 text-sm text-[color:var(--text-secondary)]">Status</div>
            <div className="mt-1 font-mono text-2xl text-[color:var(--text-primary)]">
              {survey.active === false ? "Paused" : "Active"}
            </div>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
            <CalendarDays className="h-5 w-5 text-[color:var(--info)]" />
            <div className="mt-3 text-sm text-[color:var(--text-secondary)]">Last updated</div>
            <div className="mt-1 font-mono text-sm text-[color:var(--text-primary)]">
              {formatDateTime(survey.lastUpdated)}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={() => router.push(`/surveys/${survey.id}/respond`)} rightIcon={<Play className="h-4 w-4" />}>
            Begin Survey
          </Button>
          <Button variant="ghost" onClick={() => router.push("/surveys")}>
            Browse more surveys
          </Button>
        </div>
      </div>
    </div>
  );
}
