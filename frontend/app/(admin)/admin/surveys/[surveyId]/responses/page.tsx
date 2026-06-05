"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Download, Mail, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useResponses, useResponsesActions, useSurvey } from "@/lib/hooks";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";

const pageSizeOptions = [10, 25, 50] as const;

export default function SurveyResponsesPage() {
  const params = useParams<{ surveyId: string }>();
  const surveyId = params.surveyId;
  const surveyQuery = useSurvey(surveyId);

  const [emailFilter, setEmailFilter] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedEmail(emailFilter), 400);
    return () => window.clearTimeout(timer);
  }, [emailFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedEmail, pageSize]);

  const responsesQuery = useResponses(surveyId, {
    email: debouncedEmail,
    page,
    size: pageSize
  });
  const { downloadCertificate } = useResponsesActions(surveyId);

  const responses = responsesQuery.data ?? [];
  const hasResponses = responses.length > 0;

  const visiblePages = useMemo(() => {
    const pages = new Set<number>([page]);
    if (page > 1) pages.add(page - 1);
    if (responses.length === pageSize) pages.add(page + 1);
    return Array.from(pages).sort((a, b) => a - b);
  }, [page, pageSize, responses.length]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
          <Link href="/admin/surveys" className="transition hover:text-[color:var(--text-primary)]">
            Surveys
          </Link>
          <span className="mx-2 text-[color:var(--text-muted)]">/</span>
          <Link href={`/surveys/${surveyId}`} className="transition hover:text-[color:var(--text-primary)]">
            {surveyQuery.data?.name ?? surveyId}
          </Link>
          <span className="mx-2 text-[color:var(--text-muted)]">/</span>
          <span>Responses</span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl text-[color:var(--text-primary)] sm:text-5xl">
              {surveyQuery.data?.name ?? "Survey"} Responses
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[color:var(--text-secondary)]">
              Filter by email, browse the response history, and download certificates directly from the table.
            </p>
          </div>
          <Badge tone="teal" className="font-mono text-sm">
            {responses.length} responses
          </Badge>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-[color:var(--border)] bg-[rgba(12,20,16,0.8)] p-4 backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_auto_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
            <Input
              value={emailFilter}
              onChange={(event) => setEmailFilter(event.target.value)}
              placeholder="Filter by email address"
              className="pl-11"
            />
            {responsesQuery.isFetching ? (
              <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[color:var(--primary)] border-t-transparent" />
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-[color:var(--text-secondary)]">
              Page size
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value) as (typeof pageSizeOptions)[number])}
              className="focus-ring h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 text-[color:var(--text-primary)]"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-start lg:justify-end">
            <Badge tone="neutral" className="font-mono">
              {responses.length} responses
            </Badge>
          </div>
        </div>
      </div>

      {responsesQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
              <Skeleton className="h-5 w-full rounded-lg" />
              <Skeleton className="mt-3 h-4 w-5/6 rounded-lg" />
              <Skeleton className="mt-2 h-4 w-4/6 rounded-lg" />
            </div>
          ))}
        </div>
      ) : hasResponses ? (
        <div className="overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[rgba(12,20,16,0.88)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-[rgba(17,29,24,0.98)] text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                <tr>
                  <th className="px-4 py-4">Response ID</th>
                  <th className="px-4 py-4">Full Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Gender</th>
                  <th className="px-4 py-4">Programming Stack</th>
                  <th className="px-4 py-4">Certificates</th>
                  <th className="px-4 py-4">Date Responded</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((response, index) => (
                  <tr
                    key={response.id}
                    className={cn(
                      "group transition",
                      index % 2 === 0 ? "bg-[color:var(--bg-surface)]" : "bg-[color:var(--bg-subtle)]",
                      "hover:bg-[rgba(13,148,136,0.08)]"
                    )}
                  >
                    <td className="relative px-4 py-4 font-mono text-sm text-[color:var(--text-primary)]">
                      <span className="absolute left-0 top-0 h-full w-0 bg-[color:var(--primary)] transition-[width] duration-200 group-hover:w-1" />
                      <span className="relative">{response.id}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-[color:var(--text-primary)]">{response.fullName}</td>
                    <td className="px-4 py-4 text-sm text-[color:var(--text-secondary)]">{response.email}</td>
                    <td className="px-4 py-4 text-sm text-[color:var(--text-secondary)]">{response.gender || "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {response.programmingStack.length > 0 ? (
                          response.programmingStack.map((stack) => (
                            <span
                              key={stack}
                              className="rounded-full border border-[rgba(13,148,136,0.24)] bg-[rgba(13,148,136,0.12)] px-2.5 py-1 text-xs text-[color:var(--accent)]"
                            >
                              {stack}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-[color:var(--text-muted)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        {response.certificates.length > 0 ? (
                          response.certificates.map((certificate) => (
                            <button
                              key={certificate.id}
                              type="button"
                              onClick={() => downloadCertificate.mutate({ id: certificate.id, filename: certificate.filename })}
                              className="focus-ring flex items-center gap-2 text-sm text-[color:var(--text-secondary)] transition hover:text-[color:var(--text-primary)]"
                            >
                              <Download className="h-4 w-4 text-[color:var(--primary)]" />
                              <span>{certificate.filename}</span>
                            </button>
                          ))
                        ) : (
                          <span className="text-sm text-[color:var(--text-muted)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="font-mono text-sm text-[color:var(--text-primary)]"
                        title={formatRelativeTime(response.respondedAt)}
                      >
                        {formatDateTime(response.respondedAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={cn(
                "focus-ring min-w-10 rounded-full border px-3 py-2 font-mono text-sm transition",
                pageNumber === page
                  ? "border-[color:var(--primary)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)]"
                  : "border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-active)] hover:text-[color:var(--text-primary)]"
              )}
            >
              {pageNumber}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          rightIcon={<ChevronRight className="h-4 w-4" />}
          onClick={() => setPage((current) => current + 1)}
          disabled={responses.length < pageSize}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
