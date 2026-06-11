"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Mail,
  CalendarDays,
  ChevronRight as Arrow,
  Users,
  Bookmark,
  Inbox
} from "lucide-react";
import { TalentVaultToggle } from "@/components/admin/TalentVaultToggle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { ResponseAnswerActions } from "@/components/admin/ResponseAnswerActions";
import { ResponseDetailModal } from "@/components/admin/ResponseDetailModal";
import { useQuestions, useResponses, useResponsesActions, useSurvey, useTalentVault } from "@/lib/hooks";
import { buildQuestionTypeMap, collectResponseActions } from "@/lib/responseAnswerActions";
import {
  buildOrderedAnswerEntries,
  deriveResponseIdentity,
  formatAnswerPreview
} from "@/lib/responseUtils";
import { cn, formatDateTime, formatRelativeTime, truncate } from "@/lib/utils";
import type { Question, QuestionType } from "@/types/question";
import type { SurveyResponseSummary } from "@/types/survey";

const pageSizeOptions = [10, 25, 50] as const;
type ResponseView = "all" | "vault";

function ResponseCard({
  response,
  index,
  questions,
  questionTypeMap,
  vaultLoading,
  onClick,
  onToggleVault,
  onDownloadCertificate
}: {
  response: SurveyResponseSummary;
  index: number;
  questions?: Question[];
  questionTypeMap?: Map<string, QuestionType>;
  vaultLoading?: boolean;
  onClick: () => void;
  onToggleVault: (response: SurveyResponseSummary) => void;
  onDownloadCertificate: (cert: { id: string; filename: string }) => void;
}) {
  const answers = response.answers ?? {};
  const answerEntries = buildOrderedAnswerEntries(answers, questions);
  const answerCount = answerEntries.length;
  const previewEntries = answerEntries.slice(0, 4);
  const hasCerts = response.certificates.length > 0;
  const quickActions = collectResponseActions(response, questionTypeMap).slice(0, 3);
  const reduceMotion = useReducedMotion();
  const cardSpring = { type: "spring" as const, stiffness: 400, damping: 26 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        opacity: { duration: 0.3, delay: index * 0.05 },
        y: { ...cardSpring, delay: index * 0.05 },
        scale: cardSpring
      }}
      whileHover={
        reduceMotion
          ? undefined
          : { y: -6, scale: 1.015, transition: cardSpring }
      }
      className={cn(
        "group w-full rounded-2xl border bg-[color:var(--bg-surface)] p-4 sm:p-5",
        response.shortlisted
          ? "border-[rgba(13,148,136,0.35)] shadow-[0_0_0_1px_rgba(13,148,136,0.2),0_12px_36px_rgba(13,148,136,0.1)]"
          : "border-[color:var(--border)] hover:border-[color:var(--border-active)] hover:shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_12px_36px_rgba(0,0,0,0.28)]"
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onClick();
            }
          }}
          className="min-w-0 flex-1 cursor-pointer text-left focus-ring rounded-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Name + ID */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {response.fullName || "Anonymous"}
                </span>
                <Badge tone="neutral" className="font-mono text-[11px]">#{response.id}</Badge>
                {response.shortlisted ? (
                  <Badge tone="success" className="text-[11px]">Vault</Badge>
                ) : null}
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

              {/* Answer preview chips */}
              {answerCount > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {previewEntries.map(({ key, label, value }) => {
                    const preview = formatAnswerPreview(value, questionTypeMap?.get(key));
                    return (
                      <span
                        key={key}
                        className="max-w-full truncate rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-2.5 py-0.5 text-[11px] text-[color:var(--text-secondary)] sm:max-w-[18rem]"
                        title={`${label}: ${preview}`}
                      >
                        <span className="font-medium text-[color:var(--text-muted)]">{label}:</span>{" "}
                        {truncate(preview || "—", 42)}
                      </span>
                    );
                  })}
                  {answerCount > 4 ? (
                    <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-2.5 py-0.5 font-mono text-[11px] text-[color:var(--text-muted)]">
                      +{answerCount - 4} more
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <Arrow className="h-5 w-5 shrink-0 text-[color:var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--primary)]" />
          </div>
        </div>

        <TalentVaultToggle
          shortlisted={Boolean(response.shortlisted)}
          loading={vaultLoading}
          size="md"
          onToggle={(event) => {
            event.stopPropagation();
            onToggleVault(response);
          }}
        />
      </div>

      {quickActions.length > 0 ? (
        <ResponseAnswerActions
          actions={quickActions}
          className="mt-3 flex flex-wrap gap-2"
          onActionClick={(event) => event.stopPropagation()}
          onDownloadCertificate={(cert) => {
            onDownloadCertificate(cert);
          }}
        />
      ) : null}
    </motion.div>
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

  const [view, setView] = useState<ResponseView>("all");
  const [emailFilter, setEmailFilter] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10);
  const [page, setPage] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponseSummary | null>(null);
  const [vaultTargetId, setVaultTargetId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedEmail(emailFilter), 400);
    return () => window.clearTimeout(t);
  }, [emailFilter]);

  useEffect(() => { setPage(1); }, [debouncedEmail, pageSize, view]);

  const responsesQuery = useResponses(surveyId, {
    email: debouncedEmail,
    page,
    size: pageSize,
    shortlisted: view === "vault"
  });
  const vaultCountQuery = useResponses(surveyId, { shortlisted: true, page: 1, size: 1 });
  const { downloadCertificate } = useResponsesActions(surveyId);
  const { toggleVault } = useTalentVault(surveyId);

  const handleToggleVault = (response: SurveyResponseSummary) => {
    setVaultTargetId(response.id);
    toggleVault.mutate(
      { response, nextShortlisted: !response.shortlisted },
      {
        onSettled: () => setVaultTargetId(null),
        onSuccess: () => {
          if (selectedResponse?.id === response.id) {
            setSelectedResponse({ ...response, shortlisted: !response.shortlisted });
          }
        }
      }
    );
  };

  const data = responsesQuery.data;
  const questions = questionsQuery.data ?? [];
  const responses: SurveyResponseSummary[] = useMemo(
    () =>
      (data?.items ?? []).map((response) => {
        const identity = deriveResponseIdentity(response.answers ?? {}, questions);
        return {
          ...response,
          fullName: identity.fullName || response.fullName,
          email: identity.email || response.email
        };
      }),
    [data?.items, questions]
  );
  const lastPage = data?.lastPage ?? 1;
  const totalCount = data?.totalCount ?? 0;

  const visiblePages = useMemo(() => {
    const pages = new Set<number>([page]);
    if (page > 1) pages.add(page - 1);
    if (page < lastPage) pages.add(page + 1);
    return Array.from(pages).sort((a, b) => a - b);
  }, [page, lastPage]);

  const surveyName = surveyQuery.data?.name ?? "Survey";
  const vaultCount = vaultCountQuery.data?.totalCount ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb + heading */}
      <div className="mb-8 space-y-4">
        <div className="truncate text-sm uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
          <Link href="/admin/surveys" className="transition hover:text-[color:var(--text-primary)]">Surveys</Link>
          <span className="mx-2">/</span>
          <Link
            href={`/surveys/${surveyId}`}
            className="survey-name survey-name--sm inline-block max-w-[12rem] truncate align-bottom transition hover:text-[color:var(--primary)] sm:max-w-none"
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
              Review submissions, save standout candidates to your talent vault, and return to them anytime.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 py-2 font-mono text-sm text-[color:var(--text-primary)]">
              <Users className="h-4 w-4 text-[color:var(--primary)]" />
              {view === "vault" ? vaultCount : totalCount}{" "}
              {view === "vault"
                ? `saved candidate${vaultCount !== 1 ? "s" : ""}`
                : `response${totalCount !== 1 ? "s" : ""}`}
            </span>
            {view === "all" && vaultCount > 0 ? (
              <span className="flex items-center gap-2 rounded-2xl border border-[rgba(13,148,136,0.28)] bg-[rgba(13,148,136,0.1)] px-4 py-2 text-sm text-[color:var(--accent)]">
                <Bookmark className="h-4 w-4 fill-current" />
                {vaultCount} in vault
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="mb-4 -mx-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex min-w-full gap-2 sm:min-w-0">
          <button
            type="button"
            onClick={() => setView("all")}
            className={cn(
              "focus-ring inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition sm:flex-none",
              view === "all"
                ? "border-[color:var(--primary)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-active)]"
            )}
          >
            <Inbox className="h-4 w-4 shrink-0" />
            All responses
          </button>
          <button
            type="button"
            onClick={() => setView("vault")}
            className={cn(
              "focus-ring inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition sm:flex-none",
              view === "vault"
                ? "border-[color:var(--primary)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-active)]"
            )}
          >
            <Bookmark className="h-4 w-4 shrink-0 fill-current" />
            Talent vault
            {vaultCount > 0 ? (
              <span className="rounded-full bg-[rgba(13,148,136,0.2)] px-2 py-0.5 font-mono text-[11px]">
                {vaultCount}
              </span>
            ) : null}
          </button>
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
          <div className="flex flex-wrap items-center gap-2">
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
              questions={questions}
              questionTypeMap={questionTypeMap}
              vaultLoading={vaultTargetId === response.id && toggleVault.isPending}
              onClick={() => setSelectedResponse(response)}
              onToggleVault={handleToggleVault}
              onDownloadCertificate={(cert) => downloadCertificate.mutate(cert)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={view === "vault" ? "Talent vault is empty" : "Awaiting responses"}
          description={
            view === "vault"
              ? "Bookmark candidates from the full response list to build your shortlist for future reference."
              : "Share this survey link to start collecting answers."
          }
          actionLabel={view === "vault" ? "Browse all responses" : "Copy survey link"}
          onAction={async () => {
            if (view === "vault") {
              setView("all");
              return;
            }
            await navigator.clipboard.writeText(`${window.location.origin}/surveys/${surveyId}`);
          }}
        />
      )}

      {/* Pagination */}
      {lastPage > 1 ? (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
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
            className="w-full sm:w-auto"
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
        questions={questions}
        questionTypeMap={questionTypeMap}
        vaultLoading={Boolean(selectedResponse && vaultTargetId === selectedResponse.id && toggleVault.isPending)}
        onToggleVault={handleToggleVault}
        onClose={() => setSelectedResponse(null)}
        onDownloadCertificate={(cert) => downloadCertificate.mutate(cert)}
      />
    </div>
  );
}
