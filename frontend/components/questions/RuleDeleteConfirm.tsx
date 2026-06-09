"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./BranchingRulesPanel.module.css";
import type { BranchingRule } from "@/types/rule";

type RuleDeleteConfirmProps = {
  rule: BranchingRule;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RuleDeleteConfirm({ rule, loading, error, onCancel, onConfirm }: RuleDeleteConfirmProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div className={styles.deleteBanner}>
      <div className={styles.deleteContent}>
        <AlertTriangle className={`h-4 w-4 ${styles.deleteIcon}`} aria-hidden />
        {error ? (
          <p className={styles.errorText}>{error}</p>
        ) : (
          <p className={styles.deleteText}>
            Delete rule: {rule.sourceQuestionName} → {rule.triggerValue} → {rule.targetQuestionName}? This
            cannot be undone.
          </p>
        )}
      </div>
      <div className={styles.deleteActions}>
        <button
          ref={cancelRef}
          type="button"
          className="focus-ring rounded-xl px-3 py-2 text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--bg-subtle)] disabled:opacity-60"
          disabled={loading}
          onClick={onCancel}
        >
          Cancel
        </button>
        <Button type="button" variant="destructive" size="sm" loading={loading} onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </div>
  );
}
