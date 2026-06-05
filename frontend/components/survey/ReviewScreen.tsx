"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Edit3, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatBytes } from "@/lib/utils";

export function ReviewScreen({
  items,
  onEdit,
  onSubmit,
  submitting
}: {
  items: Array<{
    questionId: string;
    questionText: string;
    answerText: string;
    files?: File[];
  }>;
  onEdit: (index: number) => void;
  onSubmit: () => void;
  submitting?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="space-y-6 rounded-[1.75rem] border border-[color:var(--border)] bg-[rgba(12,20,16,0.92)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-7"
    >
      <div>
        <h2 className="font-display text-3xl text-[color:var(--text-primary)]">Review your responses</h2>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Confirm everything before submission. You can jump back to any step.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.questionId}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 py-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-[color:var(--text-secondary)]">{item.questionText}</div>
                <div className="mt-2 text-base text-[color:var(--text-primary)]">{item.answerText || "—"}</div>
                {item.files?.length ? (
                  <div className="mt-3 space-y-2">
                    {item.files.map((file) => (
                      <div key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                        <FileText className="h-4 w-4 text-[color:var(--primary)]" />
                        <span>{file.name}</span>
                        <span className="font-mono text-[12px] text-[color:var(--text-muted)]">{formatBytes(file.size)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onEdit(index)}
                className="focus-ring rounded-full p-2 text-[color:var(--text-muted)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
                aria-label={`Edit ${item.questionText}`}
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onSubmit} loading={submitting} className="w-full">
        Submit Survey
      </Button>
    </motion.section>
  );
}
