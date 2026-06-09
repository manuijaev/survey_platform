"use client";

import { MoreVertical, Pencil, Play, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, truncate } from "@/lib/utils";
import type { Survey } from "@/types/survey";
import styles from "./SurveyCard.module.css";

type SurveyCardProps = {
  survey: Survey;
  mode?: "public" | "admin";
  className?: string;
  onEdit?: (survey: Survey) => void;
  onManageQuestions?: (survey: Survey) => void;
  onViewResponses?: (survey: Survey) => void;
  onDelete?: (survey: Survey) => void;
};

function formatUpdatedLabel(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

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
  const updatedLabel = formatUpdatedLabel(survey.lastUpdated);

  const goToSurvey = () => router.push(`/surveys/${survey.id}`);

  return (
    <article className={cn(styles.card, className)}>
      <div className={styles.header}>
        <h3 className={cn("survey-name survey-name--md", styles.title, styles.titleGlass)}>{survey.name}</h3>

        {mode === "admin" ? (
          <div className={styles.menuWrap}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className={cn("focus-ring", styles.menuButton)}
              aria-label="Open survey menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen ? (
              <div className={styles.menuPanel}>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(survey);
                  }}
                  className={styles.menuItem}
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
                  className={styles.menuItem}
                >
                  <Settings2 className="h-4 w-4" />
                  Questions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onViewResponses?.(survey);
                  }}
                  className={styles.menuItem}
                >
                  <Play className="h-4 w-4" />
                  Responses
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(survey);
                  }}
                  className={cn(styles.menuItem, styles.menuItemDanger)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className={styles.description}>
        {survey.description ? truncate(survey.description, 140) : "This survey is ready to collect responses."}
      </p>

      <div className={styles.meta}>
        <Badge tone="teal" className="max-w-full truncate font-mono">
          ID {survey.id}
        </Badge>
        <Badge tone="neutral">{survey.responseCount} responses</Badge>
        {updatedLabel ? (
          <Badge tone="info" className="max-w-full truncate font-mono">
            {updatedLabel}
          </Badge>
        ) : null}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerLabel}>{mode === "public" ? "Public" : "Admin"}</span>
        <div className={styles.footerActions}>
          {mode === "public" ? (
            <Button variant="outline" size="sm" rightIcon={<Play className="h-4 w-4" />} onClick={goToSurvey}>
              Begin
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => onManageQuestions?.(survey)}>
                Questions
              </Button>
              <Button variant="outline" size="sm" onClick={() => onViewResponses?.(survey)}>
                Responses
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
