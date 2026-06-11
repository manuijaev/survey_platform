"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, ExternalLink, FileText, X, Printer, CalendarDays, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TalentVaultToggle } from "@/components/admin/TalentVaultToggle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getAnswerAction } from "@/lib/responseAnswerActions";
import {
  buildOrderedAnswerEntries,
  collectReferencedCertificateIds,
  findCertificateForFilename,
  slugToLabel,
  splitAnswerValues
} from "@/lib/responseUtils";
import { cn, formatDateTime } from "@/lib/utils";
import type { Question, QuestionType } from "@/types/question";
import type { SurveyResponseSummary } from "@/types/survey";
import styles from "./ResponseDetailModal.module.css";

const popSpring = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.82 };
const softSpring = { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.9 };
const snapSpring = { type: "spring" as const, stiffness: 520, damping: 34, mass: 0.75 };

const backdropVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: {
    opacity: 1,
    backdropFilter: "blur(12px)",
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  },
  exit: { opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.22 } }
};

const panelVariants = {
  hidden: {
    opacity: 0,
    y: 72,
    scale: 0.86,
    rotateX: 8,
    filter: "blur(6px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      ...popSpring,
      opacity: { duration: 0.28 },
      filter: { duration: 0.35 }
    }
  },
  exit: {
    opacity: 0,
    y: 48,
    scale: 0.94,
    rotateX: 4,
    filter: "blur(4px)",
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] }
  }
};

const glowVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: { delay: 0.08, ...softSpring } },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.2 } }
};

const headerItem = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.12 + i * 0.07, ...snapSpring }
  })
};

const answerCard = {
  hidden: { opacity: 0, y: 22, scale: 0.94, rotate: -0.6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { delay: 0.2 + i * 0.055, ...softSpring }
  })
};

const footerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.28, ...softSpring } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } }
};

function AnswerActionButton({
  fieldKey,
  value,
  questionType
}: {
  fieldKey: string;
  value: string;
  questionType?: QuestionType;
}) {
  const action = getAnswerAction(fieldKey, value, questionType);
  if (!action) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-3"
      title={action.value}
      leftIcon={
        action.kind === "email" ? (
          <Mail className="h-3.5 w-3.5" />
        ) : (
          <ExternalLink className="h-3.5 w-3.5" />
        )
      }
      onClick={() => {
        if (action.kind === "email") {
          window.location.href = action.href;
          return;
        }
        window.open(action.href, "_blank", "noopener,noreferrer");
      }}
    >
      {action.label}
    </Button>
  );
}

function FileUploadRow({
  filename,
  cert,
  onDownloadCertificate
}: {
  filename: string;
  cert?: { id: string; filename: string };
  onDownloadCertificate: (cert: { id: string; filename: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--primary)]">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[color:var(--text-primary)]">{filename}</div>
          <div className="text-xs text-[color:var(--text-muted)]">PDF document</div>
        </div>
      </div>
      {cert ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          leftIcon={<Download className="h-3.5 w-3.5" />}
          onClick={() => onDownloadCertificate(cert)}
        >
          Download
        </Button>
      ) : (
        <span className="text-xs text-[color:var(--text-muted)]">Uploaded</span>
      )}
    </div>
  );
}

function FileUploadAnswerValue({
  value,
  certificates,
  onDownloadCertificate
}: {
  value: string;
  certificates: SurveyResponseSummary["certificates"];
  onDownloadCertificate: (cert: { id: string; filename: string }) => void;
}) {
  const files = splitAnswerValues(value);
  const rows =
    files.length > 0
      ? files.map((filename) => ({
          filename,
          cert: findCertificateForFilename(filename, certificates)
        }))
      : certificates.map((cert) => ({ filename: cert.filename, cert }));

  if (rows.length === 0) {
    return <span className="text-[color:var(--text-muted)]">No files uploaded</span>;
  }

  return (
    <div className="space-y-2 pt-1">
      {rows.map(({ filename, cert }) => (
        <FileUploadRow
          key={`${cert?.id ?? "file"}-${filename}`}
          filename={filename}
          cert={cert}
          onDownloadCertificate={onDownloadCertificate}
        />
      ))}
    </div>
  );
}

// Format pipe-separated multi-choice answers as tags
function AnswerValue({
  fieldKey,
  value,
  questionType,
  certificates = [],
  onDownloadCertificate
}: {
  fieldKey: string;
  value: string;
  questionType?: QuestionType;
  certificates?: SurveyResponseSummary["certificates"];
  onDownloadCertificate?: (cert: { id: string; filename: string }) => void;
}) {
  if (questionType === "FILE_UPLOAD") {
    return (
      <FileUploadAnswerValue
        value={value}
        certificates={certificates}
        onDownloadCertificate={onDownloadCertificate ?? (() => undefined)}
      />
    );
  }

  if (!value || value === "") {
    return <span className="text-[color:var(--text-muted)]">—</span>;
  }

  const parts = splitAnswerValues(value);
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

  const action = getAnswerAction(fieldKey, value, questionType);

  // Long text answers
  if (value.length > 80) {
    return (
      <>
        <p className="mt-1 text-sm leading-6 text-[color:var(--text-primary)] whitespace-pre-wrap">
          {value}
        </p>
        {action ? (
          <AnswerActionButton fieldKey={fieldKey} value={value} questionType={questionType} />
        ) : null}
      </>
    );
  }

  return (
    <>
      <span className="text-sm text-[color:var(--text-primary)]">{value}</span>
      {action ? (
        <AnswerActionButton fieldKey={fieldKey} value={value} questionType={questionType} />
      ) : null}
    </>
  );
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
    lines.push(`${slugToLabel(key)}: ${val || "—"}`);
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
        return `<div class="row"><div class="label">${slugToLabel(k)}</div><div class="value">${valueHtml}</div></div>`;
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
  questions,
  questionTypeMap,
  vaultLoading,
  onToggleVault,
  onClose,
  onDownloadCertificate
}: {
  response: SurveyResponseSummary | null;
  surveyName: string;
  questions?: Question[];
  questionTypeMap?: Map<string, QuestionType>;
  vaultLoading?: boolean;
  onToggleVault?: (response: SurveyResponseSummary) => void;
  onClose: () => void;
  onDownloadCertificate: (cert: { id: string; filename: string }) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

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
  const answerEntries = buildOrderedAnswerEntries(answers, questions);
  const referencedCertificateIds = response ? collectReferencedCertificateIds(response) : new Set<string>();
  const orphanCertificates =
    response?.certificates.filter((cert) => !referencedCertificateIds.has(cert.id)) ?? [];

  const motionPanel = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        variants: panelVariants,
        initial: "hidden",
        animate: "visible",
        exit: "exit"
      };

  const content = (
    <AnimatePresence mode="wait">
      {response ? (
        <div
          className={cn(
            "fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4",
            styles.overlay
          )}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[rgba(4,8,6,0.88)]"
            variants={reduceMotion ? undefined : backdropVariants}
            initial={reduceMotion ? { opacity: 0 } : "hidden"}
            animate={reduceMotion ? { opacity: 1 } : "visible"}
            exit={reduceMotion ? { opacity: 0 } : "exit"}
            onClick={onClose}
          />

          <div className={cn("relative z-10 w-full sm:max-w-2xl", styles.panelShell)}>
            {!reduceMotion ? (
              <motion.div
                className={styles.glow}
                variants={glowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                aria-hidden
              />
            ) : null}

            {/* Panel */}
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Response from ${response.fullName}`}
              className={cn(
                "relative flex w-full flex-col overflow-hidden rounded-t-[2rem] border border-[color:var(--glass-border)] bg-[color:var(--bg-elevated)] sm:rounded-[2rem]",
                styles.panel
              )}
              style={{ maxHeight: "90vh", transformOrigin: "center bottom" }}
              {...motionPanel}
            >
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-[color:var(--border)] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
              <div className="min-w-0 flex-1">
                <motion.div
                  className="flex flex-wrap items-center gap-2"
                  custom={0}
                  variants={reduceMotion ? undefined : headerItem}
                  initial={reduceMotion ? false : "hidden"}
                  animate={reduceMotion ? undefined : "visible"}
                >
                  <h2 className="font-display text-2xl text-[color:var(--text-primary)]">
                    {response.fullName || "Anonymous"}
                  </h2>
                  <Badge tone="teal" className="font-mono text-xs">#{response.id}</Badge>
                  {response.shortlisted ? (
                    <Badge tone="success" className="text-[11px]">In talent vault</Badge>
                  ) : null}
                </motion.div>
                <motion.div
                  className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[color:var(--text-secondary)]"
                  custom={1}
                  variants={reduceMotion ? undefined : headerItem}
                  initial={reduceMotion ? false : "hidden"}
                  animate={reduceMotion ? undefined : "visible"}
                >
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
                </motion.div>
              </div>
              <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
                {onToggleVault ? (
                  <motion.div
                    custom={2}
                    variants={reduceMotion ? undefined : headerItem}
                    initial={reduceMotion ? false : "hidden"}
                    animate={reduceMotion ? undefined : "visible"}
                  >
                    <TalentVaultToggle
                      shortlisted={Boolean(response.shortlisted)}
                      loading={vaultLoading}
                      showLabel
                      onToggle={(event) => {
                        event.stopPropagation();
                        onToggleVault(response);
                      }}
                    />
                  </motion.div>
                ) : null}
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                  aria-label="Close"
                  custom={3}
                  variants={reduceMotion ? undefined : headerItem}
                  initial={reduceMotion ? false : "hidden"}
                  animate={reduceMotion ? undefined : "visible"}
                  whileHover={reduceMotion ? undefined : { rotate: 90, scale: 1.08 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                  transition={snapSpring}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 muted-scrollbar">

              {/* Answers */}
              <div className="mb-6">
                <motion.p
                  className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]"
                  custom={0}
                  variants={reduceMotion ? undefined : headerItem}
                  initial={reduceMotion ? false : "hidden"}
                  animate={reduceMotion ? undefined : "visible"}
                >
                  Answers
                </motion.p>
                <div className="space-y-1">
                  {answerEntries.length > 0 ? (
                    answerEntries.map(({ key, label, value }, i) => (
                      <motion.div
                        key={key}
                        custom={i}
                        variants={reduceMotion ? undefined : answerCard}
                        initial={reduceMotion ? false : "hidden"}
                        animate={reduceMotion ? undefined : "visible"}
                        whileHover={
                          reduceMotion
                            ? undefined
                            : { y: -2, scale: 1.01, transition: snapSpring }
                        }
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 py-3"
                      >
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                          {label}
                        </div>
                        <div className="mt-1">
                          <AnswerValue
                            fieldKey={key}
                            value={value}
                            questionType={questionTypeMap?.get(key)}
                            certificates={response.certificates}
                            onDownloadCertificate={onDownloadCertificate}
                          />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-[color:var(--text-muted)]">No answers recorded.</p>
                  )}
                </div>
              </div>

              {/* Certificates not linked to a file-upload answer field */}
              {orphanCertificates.length > 0 ? (
                <div>
                  <motion.p
                    className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]"
                    custom={0}
                    variants={reduceMotion ? undefined : headerItem}
                    initial={reduceMotion ? false : "hidden"}
                    animate={reduceMotion ? undefined : "visible"}
                  >
                    Additional Documents
                  </motion.p>
                  <div className="space-y-2">
                    {orphanCertificates.map((cert, i) => (
                      <motion.div
                        key={cert.id}
                        custom={answerEntries.length + i}
                        variants={reduceMotion ? undefined : answerCard}
                        initial={reduceMotion ? false : "hidden"}
                        animate={reduceMotion ? undefined : "visible"}
                      >
                        <FileUploadRow
                          filename={cert.filename}
                          cert={cert}
                          onDownloadCertificate={onDownloadCertificate}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <motion.div
              className="flex flex-col gap-3 border-t border-[color:var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              variants={reduceMotion ? undefined : footerVariants}
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "visible"}
              exit={reduceMotion ? undefined : "exit"}
            >
              <Button variant="ghost" className="w-full sm:w-auto" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                leftIcon={<Printer className="h-4 w-4" />}
                onClick={() => savePdf(response, surveyName)}
              >
                Save as PDF
              </Button>
            </motion.div>
          </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
