"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/question";
import { TypewriterText } from "./TypewriterText";

export function QuestionStep({
  question,
  index,
  total,
  seen,
  formId,
  onTypewriterDone,
  onPrevious,
  submitting,
  children,
  error,
  canGoBack
}: {
  question: Question;
  index: number;
  total: number;
  seen: boolean;
  formId?: string;
  onTypewriterDone?: () => void;
  onPrevious?: () => void;
  submitting?: boolean;
  children: ReactNode;
  error?: string;
  canGoBack?: boolean;
}) {
  const showDescription = seen;

  return (
    <motion.section
      key={question.id}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="space-y-6 rounded-none border-0 bg-transparent p-0 shadow-none md:rounded-[1.75rem] md:border md:border-[color:var(--border)] md:bg-[rgba(12,20,16,0.88)] md:p-5 md:shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
    >
      <div className="space-y-4">
        <h2 className="font-display text-3xl italic text-[color:var(--text-primary)] sm:text-[2.25rem]">
          <TypewriterText questionKey={question.id} text={question.text} instant={seen} onComplete={onTypewriterDone} />
        </h2>
        {showDescription && question.description ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]"
          >
            {question.description}
          </motion.p>
        ) : null}
      </div>

      <div className={cn("space-y-5 pb-28 md:pb-0", error && "animate-shake")}>{children}</div>

      {error ? <p className="text-sm text-[color:var(--error)]">{error}</p> : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--border)] bg-[rgba(6,10,9,0.92)] px-4 py-4 backdrop-blur-xl safe-bottom md:static md:z-auto md:border-0 md:bg-transparent md:px-0 md:py-0">
        <div className="mx-auto flex max-w-[680px] items-center justify-between gap-3">
          <div>
            {canGoBack ? (
              <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={onPrevious} type="button">
                Previous
              </Button>
            ) : null}
          </div>
          <Button
            loading={submitting}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            type="submit"
            form={formId}
          >
            Next
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
