"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Edit3,
  GitBranch,
  GripVertical,
  Info,
  ListChecks,
  Mail,
  Plus,
  Rows3,
  TextCursorInput,
  Trash2,
  Upload
} from "lucide-react";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useQuestionMutations } from "@/lib/hooks";
import { surveyApi } from "@/lib/api";
import { formatApiError } from "@/services/branchingRulesService";
import { cn, truncate } from "@/lib/utils";
import type { Question, QuestionPayload } from "@/types/question";
import styles from "./BranchingRulesPanel.module.css";

function typeBadgeMeta(type: Question["type"]) {
  switch (type) {
    case "LONG_TEXT":
      return { label: "Long Text", icon: Rows3, tone: "neutral" as const };
    case "EMAIL":
      return { label: "Email", icon: Mail, tone: "info" as const };
    case "SINGLE_CHOICE":
      return { label: "Single Choice", icon: Circle, tone: "teal" as const };
    case "MULTIPLE_CHOICE":
      return { label: "Multiple Choice", icon: ListChecks, tone: "success" as const };
    case "FILE_UPLOAD":
      return { label: "File Upload", icon: Upload, tone: "warning" as const };
    case "NUMBER":
      return { label: "Number", icon: TextCursorInput, tone: "neutral" as const };
    case "SHORT_TEXT":
    default:
      return { label: "Short Text", icon: TextCursorInput, tone: "neutral" as const };
  }
}

function SortableQuestionCard({
  question,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  active
}: {
  question: Question;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  active?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id
  });
  const meta = typeBadgeMeta(question.type);
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
        isDragging && "opacity-40",
        active && "ring-1 ring-[color:var(--primary)]"
      )}
    >
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <button
          type="button"
          className="focus-ring mt-0.5 cursor-grab rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-2 text-[color:var(--text-muted)] active:cursor-grabbing"
          aria-label="Drag question"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button type="button" className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={onToggle}>
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)]">
            <Icon className="h-4 w-4 text-[color:var(--text-secondary)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="line-clamp-1 font-medium text-[color:var(--text-primary)]">{question.text}</p>
              {question.required ? <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" /> : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={meta.tone} className="gap-1">
                <Icon className="h-3 w-3" />
                {meta.label}
              </Badge>
              <Badge tone="neutral" className="font-mono text-[11px]">
                {question.slug ?? question.id}
              </Badge>
              <Badge tone="info">Survey flow</Badge>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="focus-ring rounded-full p-2 text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
            aria-label={`Edit ${question.text}`}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="focus-ring rounded-full p-2 text-[color:var(--text-secondary)] transition hover:bg-[rgba(248,113,113,0.08)] hover:text-[color:var(--error)]"
            aria-label={`Delete ${question.text}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="focus-ring rounded-full p-2 text-[color:var(--text-secondary)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--text-primary)]"
            aria-label={expanded ? "Collapse question" : "Expand question"}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-[color:var(--border)] px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4">
            <div className="text-sm leading-6 text-[color:var(--text-secondary)]">
              {question.description || "No description provided."}
            </div>
            {question.options.length > 0 ? (
              <div className="mt-4 space-y-2">
                {question.options.map((option) => (
                  <div
                    key={option.value}
                    className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 text-sm text-[color:var(--text-primary)]"
                  >
                    <span className="font-mono text-[12px] text-[color:var(--text-muted)]">{option.value}</span>
                    <span className="ml-3">{option.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BranchTargetRow({ question }: { question: Question }) {
  const meta = typeBadgeMeta(question.type);
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]">
          <Icon className="h-4 w-4 text-[color:var(--text-secondary)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 font-medium text-[color:var(--text-primary)]">{question.text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone} className="gap-1">
              <Icon className="h-3 w-3" />
              {meta.label}
            </Badge>
            <Badge tone="neutral" className="font-mono text-[11px]">
              {question.slug ?? question.id}
            </Badge>
            <Badge tone="warning">Branch target</Badge>
          </div>
          <p className="mt-2 text-xs text-[color:var(--text-muted)]">Managed in the Target questions tab.</p>
        </div>
      </div>
    </div>
  );
}

type SourceQuestionsPanelProps = {
  surveyId: string;
  surveyName?: string;
};

export function SourceQuestionsPanel({
  surveyId,
  surveyName
}: SourceQuestionsPanelProps) {
  const { createQuestion, updateQuestion, deleteQuestion, reorderQuestions } = useQuestionMutations(surveyId);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Question | null>(null);

  const loadQuestions = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await surveyApi.getQuestions(surveyId);
      setAllQuestions(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions, reloadToken]);

  useEffect(() => {
    setExpandedId(null);
    setDrawerOpen(false);
    setEditingQuestion(null);
    setPendingDelete(null);
  }, [surveyId]);

  const surveyFlowQuestions = useMemo(
    () => allQuestions.filter((question) => !question.branchOnly),
    [allQuestions]
  );

  const branchTargetQuestions = useMemo(
    () => allQuestions.filter((question) => question.branchOnly),
    [allQuestions]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    setActiveQuestion(surveyFlowQuestions.find((question) => question.id === activeId) ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveQuestion(null);
    if (!over || active.id === over.id) return;

    const oldIndex = surveyFlowQuestions.findIndex((question) => question.id === active.id);
    const newIndex = surveyFlowQuestions.findIndex((question) => question.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previousOrder = allQuestions;
    const reorderedSurvey = arrayMove(surveyFlowQuestions, oldIndex, newIndex);
    const nextOrder = [...reorderedSurvey, ...branchTargetQuestions];
    setAllQuestions(nextOrder);
    try {
      await reorderQuestions.mutateAsync(nextOrder.map((question) => question.id));
      setReloadToken((value) => value + 1);
    } catch {
      setAllQuestions(previousOrder);
      setReloadToken((value) => value + 1);
    }
  };

  const openCreate = () => {
    setEditingQuestion(null);
    setDrawerOpen(true);
  };

  const saveQuestion = async (values: QuestionPayload) => {
    const payload = { ...values, branchOnly: false };
    const questionId = editingQuestion?.id ?? "";
    if (/^\d+$/.test(questionId)) {
      await updateQuestion.mutateAsync({ questionId, payload });
    } else {
      await createQuestion.mutateAsync(payload);
    }
    setDrawerOpen(false);
    setEditingQuestion(null);
    setReloadToken((value) => value + 1);
  };

  const deleteCurrent = async () => {
    if (!pendingDelete) return;
    await deleteQuestion.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
    setReloadToken((value) => value + 1);
  };

  if (!mounted || loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <GitBranch className="h-5 w-5" />
            Source questions
          </div>
        </div>
        <div className="space-y-4 p-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <div className={styles.loadError}>
          <p className={styles.emptyTitle}>Could not load questions</p>
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
          <GitBranch className="h-5 w-5" />
          Source questions
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add question
          </Button>
        </div>
      </div>

      <div className={styles.infoBanner}>
        <Info className={`h-4 w-4 ${styles.infoIcon}`} aria-hidden />
        <div>
          All questions for <strong className="survey-name survey-name--sm">{surveyName ?? "this survey"}</strong>.
          Survey flow questions can trigger
          branching rules. Custom follow-up questions are created in the Target questions tab.
        </div>
      </div>

      {allQuestions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Add survey flow questions here. They appear in the branching rules source dropdown."
          actionLabel="Add question"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-4">
          {surveyFlowQuestions.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={surveyFlowQuestions.map((question) => question.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {surveyFlowQuestions.map((question) => (
                    <SortableQuestionCard
                      key={question.id}
                      question={question}
                      expanded={expandedId === question.id}
                      active={activeQuestion?.id === question.id}
                      onToggle={() =>
                        setExpandedId((current) => (current === question.id ? null : question.id))
                      }
                      onEdit={() => {
                        setEditingQuestion(question);
                        setDrawerOpen(true);
                      }}
                      onDelete={() => setPendingDelete(question)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeQuestion ? (
                  <div className="rounded-2xl border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.12)] p-4">
                    <p className="font-medium text-[color:var(--text-primary)]">{activeQuestion.text}</p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : null}

          {branchTargetQuestions.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
                Branch target questions ({branchTargetQuestions.length})
              </p>
              {branchTargetQuestions.map((question) => (
                <BranchTargetRow key={question.id} question={question} />
              ))}
            </div>
          ) : null}
        </div>
      )}

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

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Remove this question?"
        description="The question will disappear from the survey and future responses."
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void deleteCurrent()}
              loading={deleteQuestion.isPending}
            >
              Remove
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl border border-[rgba(13,148,136,0.24)] bg-[rgba(13,148,136,0.08)] p-4 font-mono text-sm text-[color:var(--text-primary)]">
          {truncate(pendingDelete?.text ?? "", 140)}
        </div>
      </Modal>
    </div>
  );
}
