"use client";

import { MoreVertical, Pencil, Play, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatDateTime, truncate } from "@/lib/utils";
import type { Survey } from "@/types/survey";

type SurveyCardProps = {
  survey: Survey;
  mode?: "public" | "admin";
  className?: string;
  onEdit?: (survey: Survey) => void;
  onManageQuestions?: (survey: Survey) => void;
  onViewResponses?: (survey: Survey) => void;
  onDelete?: (survey: Survey) => void;
};

export function SurveyCard({
  survey,
  mode = "public",
  className,
  onEdit,
  onManageQuestions,
  onViewResponses,
  onDelete
}: SurveyCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const goToSurvey = () => router.push(`/surveys/${survey.id}`);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 transition duration-200 ease-out hover:-translate-y-1 hover:border-[color:var(--border-active)] hover:shadow-[0_0_0_1px_rgba(13,148,136,0.18),0_0_28px_rgba(13,148,136,0.14)]",
        className
      )}
    >
      {mode === "public" ? (
        <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(135deg,var(--primary),var(--accent))]" />
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[22px] text-[color:var(--text-primary)]">{survey.name}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[color:var(--text-secondary)]">
            {survey.description ? truncate(survey.description, 180) : "This survey is ready to collect responses."}
          </p>
        </div>

        {mode === "admin" ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="focus-ring rounded-full p-2 text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
              aria-label="Open survey menu"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-2 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(survey);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onManageQuestions?.(survey);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                >
                  <Settings2 className="h-4 w-4" />
                  Manage Questions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onViewResponses?.(survey);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                >
                  <Play className="h-4 w-4" />
                  View Responses
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(survey);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[color:var(--error)] transition hover:bg-[rgba(248,113,113,0.08)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge tone="teal" className="font-mono">
          ID {survey.id}
        </Badge>
        <Badge tone="neutral">{survey.responseCount} responses</Badge>
        {survey.lastUpdated ? (
          <Badge tone="info" className="font-mono">
            Updated {formatDateTime(survey.lastUpdated)}
          </Badge>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
          {mode === "public" ? "Available survey" : "Admin survey"}
        </div>
        {mode === "public" ? (
          <Button variant="outline" rightIcon={<Play className="h-4 w-4" />} onClick={goToSurvey}>
            Begin Survey
          </Button>
        ) : null}
      </div>
    </article>
  );
}
