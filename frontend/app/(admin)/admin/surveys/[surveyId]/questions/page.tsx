"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Edit3,
  GripVertical,
  ListChecks,
  Mail,
  Plus,
  TextCursorInput,
  Trash2,
  Upload,
  Rows3
} from "lucide-react";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { RuleEditor } from "@/components/admin/RuleEditor";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useQuestionMutations, useQuestions, useSurvey } from "@/lib/hooks";
import { cn, truncate } from "@/lib/utils";
import type { Question } from "@/types/question";
import type { SurveyRule } from "@/types/rule";
import { surveyApi } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toastService } from "@/lib/toast-service";

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
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
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

        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          onClick={onToggle}
        >
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
            <div className="text-sm leading-6 text-[color:var(--text-secondary)]">{question.description || "No description provided."}</div>
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

function QuestionGhostCard({ question }: { question: Question }) {
  const meta = typeBadgeMeta(question.type);
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-[color:var(--border-active)] bg-[rgba(13,148,136,0.12)] p-4 shadow-[0_0_24px_rgba(13,148,136,0.12)]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)]">
          <Icon className="h-4 w-4 text-[color:var(--text-secondary)]" />
        </div>
        <div className="flex-1">
          <div className="line-clamp-1 font-medium text-[color:var(--text-primary)]">{question.text}</div>
          <div className="mt-2 text-sm text-[color:var(--text-secondary)]">Reordering</div>
        </div>
      </div>
    </div>
  );
}

export default function QuestionManagementPage() {
  const params = useParams<{ surveyId: string }>();
  const surveyId = params.surveyId;
  const surveyQuery = useSurvey(surveyId);
  const questionsQuery = useQuestions(surveyId);
  const { createQuestion, updateQuestion, deleteQuestion, reorderQuestions } = useQuestionMutations(surveyId);

  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Question | null>(null);
  const [rules, setRules] = useState<SurveyRule[]>([]);

  useEffect(() => {
    setOrderedQuestions(questionsQuery.data ?? []);
  }, [questionsQuery.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const saveRulesMutation = useMutation({
    mutationFn: async () => {
      if (!surveyId) return;
      return surveyApi.saveRules(surveyId, rules);
    },
    onSuccess: () => {
      toastService.success("Order saved", "Question sequence updated.");
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    setActiveQuestion(orderedQuestions.find((question) => question.id === activeId) ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveQuestion(null);

    if (!over || active.id === over.id) return;

    const oldIndex = orderedQuestions.findIndex((question) => question.id === active.id);
    const newIndex = orderedQuestions.findIndex((question) => question.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const nextOrder = arrayMove(orderedQuestions, oldIndex, newIndex);
    setOrderedQuestions(nextOrder);
    await reorderQuestions.mutateAsync(nextOrder.map((question) => question.id));
  };

  const saveQuestion = async (values: {
    name: string;
    text: string;
    description?: string;
    type: Question["type"];
    required: boolean;
    options: Array<{ value: string; label: string }>;
    allowMultipleSelections?: boolean;
    fileFormat?: string;
    maxFileSizeMb?: number;
    multipleFiles?: boolean;
  }) => {
    if (editingQuestion) {
      await updateQuestion.mutateAsync({
        questionId: editingQuestion.id,
        payload: values
      });
    } else {
      await createQuestion.mutateAsync(values);
    }

    setDrawerOpen(false);
    setEditingQuestion(null);
  };

  const deleteCurrent = async () => {
    if (!pendingDelete || !surveyId) return;
    await deleteQuestion.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

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
          <span>Questions</span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl text-[color:var(--text-primary)] sm:text-5xl">
              {surveyQuery.data?.name ?? "Survey"} Questions
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[color:var(--text-secondary)]">
              Reorder questions, expand card details, and adjust branching rules for the skill-tree flow.
            </p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>
            Add Question
          </Button>
        </div>
      </div>

      {questionsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
              <Skeleton className="h-6 w-3/5 rounded-lg" />
              <Skeleton className="mt-3 h-4 w-full rounded-lg" />
              <Skeleton className="mt-2 h-4 w-5/6 rounded-lg" />
            </div>
          ))}
        </div>
      ) : orderedQuestions.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedQuestions.map((question) => question.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {orderedQuestions.map((question) => (
                <SortableQuestionCard
                  key={question.id}
                  question={question}
                  expanded={expandedId === question.id}
                  active={activeQuestion?.id === question.id}
                  onToggle={() => setExpandedId((current) => (current === question.id ? null : question.id))}
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
            {activeQuestion ? <QuestionGhostCard question={activeQuestion} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <EmptyState
          title="This survey has no questions"
          description="Add questions to begin collecting responses."
          actionLabel="Add question"
          onAction={() => setDrawerOpen(true)}
        />
      )}

      <div className="mt-10">
        <RuleEditor
          rules={rules}
          onAdd={(rule) => setRules((current) => [...current, rule])}
          onRemove={(index) => setRules((current) => current.filter((_, itemIndex) => itemIndex !== index))}
          onSave={() => {
            void saveRulesMutation.mutateAsync();
          }}
        />
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
            <Button type="button" variant="destructive" onClick={deleteCurrent} loading={deleteQuestion.isPending}>
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
