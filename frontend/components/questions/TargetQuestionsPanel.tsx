"use client";

import { useCallback, useEffect, useState } from "react";
import { Crosshair, Edit3, Info, Plus, Trash2 } from "lucide-react";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useQuestionMutations } from "@/lib/hooks";
import { surveyApi } from "@/lib/api";
import { formatApiError } from "@/services/branchingRulesService";
import type { Question, QuestionPayload } from "@/types/question";
import styles from "./BranchingRulesPanel.module.css";

function typeLabel(type: Question["type"]) {
  switch (type) {
    case "LONG_TEXT":
      return "Long text";
    case "EMAIL":
      return "Email";
    case "SINGLE_CHOICE":
      return "Single choice";
    case "MULTIPLE_CHOICE":
      return "Multiple choice";
    case "FILE_UPLOAD":
      return "File upload";
    case "NUMBER":
      return "Number";
    case "SYSTEM_DESIGN":
      return "System design";
    case "SHORT_TEXT":
    default:
      return "Short text";
  }
}

type TargetQuestionsPanelProps = {
  surveyId: string;
};

export function TargetQuestionsPanel({ surveyId }: TargetQuestionsPanelProps) {
  const { createQuestion, updateQuestion, deleteQuestion } = useQuestionMutations(surveyId);

  const [targetQuestions, setTargetQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await surveyApi.getQuestions(surveyId, "branch");
      setTargetQuestions(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions, reloadToken]);

  useEffect(() => {
    setDrawerOpen(false);
    setEditingQuestion(null);
    setDeletingId(null);
    setDeleteError(null);
  }, [surveyId]);

  const pendingDelete = deletingId ? targetQuestions.find((q) => q.id === deletingId) : null;

  const openCreate = () => {
    setDeletingId(null);
    setDeleteError(null);
    setEditingQuestion(null);
    setDrawerOpen(true);
  };

  const openEdit = (question: Question) => {
    setDeletingId(null);
    setDeleteError(null);
    setEditingQuestion(question);
    setDrawerOpen(true);
  };

  const openDelete = (question: Question) => {
    setDrawerOpen(false);
    setEditingQuestion(null);
    setDeleteError(null);
    setDeletingId(question.id);
  };

  const saveQuestion = async (values: QuestionPayload) => {
    const payload = { ...values, branchOnly: true };
    const questionId = editingQuestion?.id ?? "";
    const isEdit = /^\d+$/.test(questionId);

    if (isEdit) {
      await updateQuestion.mutateAsync({ questionId, payload });
    } else {
      await createQuestion.mutateAsync(payload);
    }
    setDrawerOpen(false);
    setEditingQuestion(null);
    setReloadToken((value) => value + 1);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteQuestion.mutateAsync(deletingId);
      setDeletingId(null);
      setReloadToken((value) => value + 1);
    } catch (err) {
      setDeleteError(formatApiError(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Crosshair className="h-5 w-5" />
            Target questions
          </div>
        </div>
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <div className={styles.loadError}>
          <p className={styles.emptyTitle}>Could not load target questions</p>
          <p className={styles.errorText}>{error}</p>
          <Button type="button" size="sm" onClick={() => setReloadToken((value) => value + 1)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Crosshair className="h-5 w-5" />
          Target questions
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Create target question
          </Button>
        </div>
      </div>

      <div className={styles.infoBanner}>
        <Info className={`h-4 w-4 ${styles.infoIcon}`} aria-hidden />
        <div>
          Create custom follow-up questions shown when a respondent answers a source question with a specific value
          in a branching rule. Each target question is written here — nothing is picked from a dropdown.
        </div>
      </div>

      {pendingDelete ? (
        <div className={styles.deleteBanner}>
          <div className={styles.deleteContent}>
            <Trash2 className={`h-4 w-4 ${styles.deleteIcon}`} aria-hidden />
            {deleteError ? (
              <p className={styles.errorText}>{deleteError}</p>
            ) : (
              <p className={styles.deleteText}>
                Delete target question{" "}
                <code className={styles.codeChip}>{pendingDelete.slug ?? pendingDelete.id}</code>? This cannot be
                undone.
              </p>
            )}
          </div>
          <div className={styles.deleteActions}>
            <button
              type="button"
              className="focus-ring rounded-xl px-3 py-2 text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--bg-subtle)] disabled:opacity-60"
              disabled={deleteLoading}
              onClick={() => {
                setDeletingId(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={deleteLoading}
              onClick={() => void confirmDelete()}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colSource}>Name</th>
              <th style={{ width: "42%" }}>Question text</th>
              <th className={styles.colTrigger}>Type</th>
              <th className={styles.colActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {targetQuestions.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={4}>
                  <div className={styles.emptyState}>
                    <Crosshair className="h-6 w-6" aria-hidden />
                    <p className={styles.emptyTitle}>No target questions yet.</p>
                    <p>Create a custom question to show when a branching rule is triggered.</p>
                    <Button type="button" size="sm" className="mt-2" onClick={openCreate}>
                      Create target question
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              targetQuestions.map((question) => (
                <tr key={question.id}>
                  <td className={styles.colSource}>
                    <code className={styles.codeChip}>{question.slug ?? question.id}</code>
                  </td>
                  <td>
                    <p className="text-sm text-[color:var(--text-primary)]">{question.text}</p>
                    {question.description ? (
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">{question.description}</p>
                    ) : null}
                  </td>
                  <td className={styles.colTrigger}>
                    <Badge tone="neutral">{typeLabel(question.type)}</Badge>
                  </td>
                  <td className={styles.colActions}>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label={`Edit target question ${question.slug ?? question.id}`}
                        onClick={() => openEdit(question)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                        aria-label={`Delete target question ${question.slug ?? question.id}`}
                        onClick={() => openDelete(question)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <QuestionEditor
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingQuestion(null);
        }}
        surveyId={surveyId}
        initialQuestion={editingQuestion}
        onSave={saveQuestion}
      />
    </div>
  );
}
