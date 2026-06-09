"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Mail,
  CalendarDays,
  ChevronRight as Arrow,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { ResponseAnswerActions } from "@/components/admin/ResponseAnswerActions";
import { ResponseDetailModal } from "@/components/admin/ResponseDetailModal";
import { useQuestions, useResponses, useResponsesActions, useSurvey } from "@/lib/hooks";
import { buildQuestionTypeMap, collectResponseActions } from "@/lib/responseAnswerActions";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { QuestionType } from "@/types/question";
import type { SurveyResponseSummary } from "@/types/survey";

const pageSizeOptions = [10, 25, 50] as const;

function ResponseCard({
  response,
  index,
  questionTypeMap,
  onClick
}: {
  response: SurveyResponseSummary;
  index: number;
  questionTypeMap?: Map<string, QuestionType>;
  onClick: () => void;
}) {
  const answers = response.answers ?? {};
  const answerCount = Object.keys(answers).length;
  const hasCerts = response.certificates.length > 0;
  const quickActions = collectResponseActions(response, questionTypeMap).slice(0, 3);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.05 }}
      className={cn(
        "group w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 text-left",
        "transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--border-active)]",
        "hover:shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_8px_32px_rgba(0,0,0,0.24)]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Name + ID */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[color:var(--text-primary)]">
              {response.fullName || "Anonymous"}
            </span>
            <Badge tone="neutral" className="font-mono text-[11px]">#{response.id}</Badge>
            {hasCerts ? (
              <Badge tone="warning" className="text-[11px]">
                {response.certificates.length} doc{response.certificates.length > 1 ? "s" : ""}
              </Badge>
            ) : null}
          </div>

          {/* Email + Date */}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[color:var(--text-secondary)]">
            {response.email ? (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[color:var(--text-muted)]" />
                {response.email}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[color:var(--text-muted)]" />
              <span title={formatDateTime(response.respondedAt)}>
                {formatRelativeTime(response.respondedAt)}
              </span>
            </span>
          </div>

          {/* Quick actions: email / portfolio / external links */}
          {quickActions.length > 0 ? (
            <ResponseAnswerActions
              actions={quickActions}
              className="mt-3 flex flex-wrap gap-2"
              onActionClick={(event) => event.stopPropagation()}
            />
          ) : null}

          {/* Answer preview chips */}
          {answerCount > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(answers)
                .slice(0, 4)
                .map(([key, val]) => (
                  <span
                    key={key}
                    className="max-w-[14rem] truncate rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-2.5 py-0.5 font-mono text-[11px] text-[color:var(--text-secondary)]"
                    title={`${key}: ${val}`}
                  >
                    {val || "—"}
                  </span>
                ))}
              {answerCount > 4 ? (
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-2.5 py-0.5 font-mono text-[11px] text-[color:var(--text-muted)]">
                  +{answerCount - 4} more
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Chevron */}
        <Arrow className="h-5 w-5 shrink-0 text-[color:var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--primary)]" />
      </div>
    </motion.button>
  );
}

function ResponseCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-2/5 rounded-full" />
          <Skeleton className="h-4 w-3/5 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
}

export default function SurveyResponsesPage() {
  const params = useParams<{ surveyId: string }>();
  const surveyId = params.surveyId;
  const surveyQuery = useSurvey(surveyId);
  const questionsQuery = useQuestions(surveyId);
  const questionTypeMap = useMemo(
    () => buildQuestionTypeMap(questionsQuery.data ?? []),
    [questionsQuery.data]
  );

  const [emailFilter, setEmailFilter] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10);
  const [page, setPage] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponseSummary | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedEmail(emailFilter), 400);
    return () => window.clearTimeout(t);
  }, [emailFilter]);

  useEffect(() => { setPage(1); }, [debouncedEmail, pageSize]);

  const responsesQuery = useResponses(surveyId, { email: debouncedEmail, page, size: pageSize });
  const { downloadCertificate } = useResponsesActions(surveyId);

  const data = responsesQuery.data;
  const responses: SurveyResponseSummary[] = data?.items ?? [];
  const lastPage = data?.lastPage ?? 1;
  const totalCount = data?.totalCount ?? 0;

  const visiblePages = useMemo(() => {
    const pages = new Set<number>([page]);
    if (page > 1) pages.add(page - 1);
    if (page < lastPage) pages.add(page + 1);
    return Array.from(pages).sort((a, b) => a - b);
  }, [page, lastPage]);

  const surveyName = surveyQuery.data?.name ?? "Survey";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb + heading */}
      <div className="mb-8 space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
          <Link href="/admin/surveys" className="transition hover:text-[color:var(--text-primary)]">Surveys</Link>
          <span className="mx-2">/</span>
          <Link
            href={`/surveys/${surveyId}`}
            className="survey-name survey-name--sm transition hover:text-[color:var(--primary)]"
          >
            {surveyName}
          </Link>
          <span className="mx-2">/</span>
          <span>Responses</span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Responses</p>
            <h1 className="survey-name survey-name--lg mt-3">
              {surveyName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
              Click any response to view full answers, email candidates, open portfolio links, save as PDF, or download documents.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 py-2 font-mono text-sm text-[color:var(--text-primary)]">
              <Users className="h-4 w-4 text-[color:var(--primary)]" />
              {totalCount} response{totalCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[color:var(--border)] bg-[rgba(12,20,16,0.8)] p-4 backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
            <Input
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Filter by email address"
              className="pl-11"
            />
            {responsesQuery.isFetching ? (
              <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[color:var(--primary)] border-t-transparent" />
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-[color:var(--text-secondary)]">Per page</label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as (typeof pageSizeOptions)[number])}
              className="focus-ring h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 text-[color:var(--text-primary)]"
            >
              {pageSizeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <Badge tone="neutral" className="font-mono">
            Page {page} of {lastPage}
          </Badge>
        </div>
      </div>

      {/* Response cards */}
      {responsesQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <ResponseCardSkeleton key={i} />)}
        </div>
      ) : responses.length > 0 ? (
        <div className="space-y-4">
          {responses.map((response, index) => (
            <ResponseCard
              key={response.id}
              response={response}
              index={index}
              questionTypeMap={questionTypeMap}
              onClick={() => setSelectedResponse(response)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Awaiting responses"
          description="Share this survey link to start collecting answers."
          actionLabel="Copy survey link"
          onAction={async () => {
            await navigator.clipboard.writeText(`${window.location.origin}/surveys/${surveyId}`);
          }}
        />
      )}

      {/* Pagination */}
      {lastPage > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            leftIcon={<ChevronLeft className="h-4 w-4" />}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {visiblePages.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={cn(
                  "focus-ring min-w-10 rounded-full border px-3 py-2 font-mono text-sm transition",
                  p === page
                    ? "border-[color:var(--primary)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)]"
                    : "border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-active)]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            rightIcon={<ChevronRight className="h-4 w-4" />}
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= lastPage}
          >
            Next
          </Button>
        </div>
      ) : null}

      {/* Detail modal */}
      <ResponseDetailModal
        response={selectedResponse}
        surveyName={surveyName}
        questionTypeMap={questionTypeMap}
        onClose={() => setSelectedResponse(null)}
        onDownloadCertificate={(cert) => downloadCertificate.mutate(cert)}
      />
    </div>
  );
}
