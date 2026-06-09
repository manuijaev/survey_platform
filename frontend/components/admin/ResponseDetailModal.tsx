"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, ExternalLink, FileText, X, Printer, CalendarDays, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getAnswerAction } from "@/lib/responseAnswerActions";
import { cn, formatDateTime } from "@/lib/utils";
import type { QuestionType } from "@/types/question";
import type { SurveyResponseSummary } from "@/types/survey";

// Label map: converts snake_case question slugs to readable labels
function toLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format pipe-separated multi-choice answers as tags
function AnswerValue({ value }: { value: string }) {
  if (!value || value === "") {
    return <span className="text-[color:var(--text-muted)]">—</span>;
  }

  const parts = value.split("|").map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {parts.map((part) => (
          <span
            key={part}
            className="rounded-full border border-[rgba(13,148,136,0.28)] bg-[rgba(13,148,136,0.1)] px-2.5 py-0.5 font-mono text-xs text-[color:var(--accent)]"
          >
            {part}
          </span>
        ))}
      </div>
    );
  }

  // Long text answers
  if (value.length > 80) {
    return (
      <p className="mt-1 text-sm leading-6 text-[color:var(--text-primary)] whitespace-pre-wrap">
        {value}
      </p>
    );
  }

  return <span className="text-sm text-[color:var(--text-primary)]">{value}</span>;
}

function savePdf(response: SurveyResponseSummary, surveyName: string) {
  const answers = response.answers ?? {};
  const knownMeta = new Set(["response_id"]);

  const lines: string[] = [
    `${surveyName} — Response #${response.id}`,
    `Date: ${formatDateTime(response.respondedAt)}`,
    ``,
    `ANSWERS`,
    `-------`,
  ];

  for (const [key, val] of Object.entries(answers)) {
    if (knownMeta.has(key)) continue;
    lines.push(`${toLabel(key)}: ${val || "—"}`);
  }

  if (response.certificates.length > 0) {
    lines.push(``);
    lines.push(`CERTIFICATES`);
    lines.push(`------------`);
    response.certificates.forEach((c) => lines.push(`- ${c.filename}`));
  }

  // Build a printable HTML page and trigger browser print-to-PDF
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Response #${response.id}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 40px auto; color: #1a2e28; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #5a8a80; font-size: 13px; margin-bottom: 24px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #5a8a80; border-bottom: 1px solid #dce8e4; padding-bottom: 6px; margin-bottom: 12px; }
    .row { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f0f7f4; }
    .label { font-size: 12px; color: #5a8a80; min-width: 180px; font-weight: 600; }
    .value { font-size: 13px; color: #1a2e28; flex: 1; white-space: pre-wrap; word-break: break-word; }
    .tag { display: inline-block; background: #e6f4f0; color: #0d9488; border-radius: 99px; padding: 2px 8px; font-size: 11px; margin: 2px; }
    .cert { padding: 6px 0; font-size: 13px; color: #1a2e28; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${surveyName} — Response #${response.id}</h1>
  <div class="meta">Submitted ${formatDateTime(response.respondedAt)}</div>
  <div class="section">
    <div class="section-title">Answers</div>
    ${Object.entries(answers)
      .filter(([k]) => !knownMeta.has(k))
      .map(([k, v]) => {
        const parts = (v || "").split("|").map((s: string) => s.trim()).filter(Boolean);
        const valueHtml = parts.length > 1
          ? parts.map((p: string) => `<span class="tag">${p}</span>`).join(" ")
          : `<span>${v || "—"}</span>`;
        return `<div class="row"><div class="label">${toLabel(k)}</div><div class="value">${valueHtml}</div></div>`;
      })
      .join("\n")}
  </div>
  ${response.certificates.length > 0 ? `
  <div class="section">
    <div class="section-title">Certificates</div>
    ${response.certificates.map((c) => `<div class="cert">📄 ${c.filename}</div>`).join("\n")}
  </div>` : ""}
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

export function ResponseDetailModal({
  response,
  surveyName,
  questionTypeMap,
  onClose,
  onDownloadCertificate
}: {
  response: SurveyResponseSummary | null;
  surveyName: string;
  questionTypeMap?: Map<string, QuestionType>;
  onClose: () => void;
  onDownloadCertificate: (cert: { id: string; filename: string }) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!response) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [response, onClose]);

  if (!mounted) return null;

  const answers = response?.answers ?? {};
  const knownMeta = new Set(["response_id"]);
  const answerEntries = Object.entries(answers).filter(([k]) => !knownMeta.has(k));

  const content = (
    <AnimatePresence>
      {response ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[rgba(4,8,6,0.88)] backdrop-blur-[10px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Response from ${response.fullName}`}
            className="relative z-10 flex w-full flex-col overflow-hidden rounded-t-[2rem] border border-[color:var(--glass-border)] bg-[color:var(--bg-elevated)] shadow-[0_32px_96px_rgba(0,0,0,0.5)] sm:max-w-2xl sm:rounded-[2rem]"
            style={{ maxHeight: "90vh" }}
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-6 py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl text-[color:var(--text-primary)]">
                    {response.fullName || "Anonymous"}
                  </h2>
                  <Badge tone="teal" className="font-mono text-xs">#{response.id}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[color:var(--text-secondary)]">
                  {response.email ? (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {response.email}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDateTime(response.respondedAt)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="focus-ring shrink-0 rounded-full p-2 text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 muted-scrollbar">

              {/* Answers */}
              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                  Answers
                </p>
                <div className="space-y-1">
                  {answerEntries.length > 0 ? (
                    answerEntries.map(([key, val], i) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 py-3"
                      >
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                          {toLabel(key)}
                        </div>
                        <div className="mt-1">
                          <AnswerValue
                            fieldKey={key}
                            value={val}
                            questionType={questionTypeMap?.get(key)}
                          />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-[color:var(--text-muted)]">No answers recorded.</p>
                  )}
                </div>
              </div>

              {/* Certificates */}
              {response.certificates.length > 0 ? (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                    Uploaded Documents
                  </p>
                  <div className="space-y-2">
                    {response.certificates.map((cert, i) => (
                      <motion.button
                        key={cert.id}
                        type="button"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: answerEntries.length * 0.04 + i * 0.05 }}
                        onClick={() => onDownloadCertificate(cert)}
                        className="focus-ring flex w-full items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 py-3 text-left transition hover:border-[color:var(--primary)] hover:bg-[rgba(13,148,136,0.08)]"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)]">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-[color:var(--text-primary)]">
                            {cert.filename}
                          </div>
                          <div className="text-xs text-[color:var(--text-muted)]">Click to download</div>
                        </div>
                        <Download className="h-4 w-4 shrink-0 text-[color:var(--primary)]" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[color:var(--border)] px-6 py-4">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="outline"
                leftIcon={<Printer className="h-4 w-4" />}
                onClick={() => savePdf(response, surveyName)}
              >
                Save as PDF
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
