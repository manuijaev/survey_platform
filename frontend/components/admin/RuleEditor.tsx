"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, GitBranch, Plus, Trash2, GitMerge } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { wrapFlowText } from "@/lib/branchFlowLayout";
import { cn } from "@/lib/utils";
import { ruleSchema, type RuleFormValues } from "@/lib/validators/rule";
import type { Question } from "@/types/question";
import type { SurveyRule } from "@/types/rule";

// Question types that can be used as branch sources (have discrete answer values)
const BRANCHABLE_TYPES = new Set<Question["type"]>([
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE"
]);

function SelectField({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  error,
  children
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[color:var(--text-primary)]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "focus-ring h-11 w-full rounded-xl border bg-[color:var(--bg-surface)] px-4 text-sm transition",
          "text-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-[color:var(--error)]"
            : "border-[color:var(--border)] focus:border-[color:var(--border-active)] focus:shadow-[0_0_0_4px_rgba(13,148,136,0.12)]"
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
      {error ? <p className="text-xs text-[color:var(--error)]">{error}</p> : null}
    </div>
  );
}

// Count how many existing rules target a given question name
function inboundCount(rules: SurveyRule[], questionName: string): number {
  return rules.filter((r) => r.targetQuestionName === questionName).length;
}

// Simple cycle detection: would adding source→target create a cycle?
function wouldCreateCycle(
  rules: SurveyRule[],
  source: string,
  target: string
): boolean {
  if (source === target) return true;
  // BFS from target — if we can reach source, adding source→target makes a cycle
  const visited = new Set<string>();
  const queue = [target];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const rule of rules) {
      if (rule.sourceQuestionName === node) {
        if (rule.targetQuestionName === source) return true;
        queue.push(rule.targetQuestionName);
      }
    }
  }
  return false;
}

export function RuleEditor({
  rules,
  questions,
  onAdd,
  onRemove,
  onSave,
  saving,
  className
}: {
  rules: SurveyRule[];
  questions: Question[];
  onAdd: (rule: SurveyRule) => void;
  onRemove: (index: number) => void;
  onSave: () => void;
  saving?: boolean;
  className?: string;
}) {
  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { sourceQuestionName: "", sourceAnswer: "", targetQuestionName: "" },
    mode: "onChange"
  });

  const sourceSlug = watch("sourceQuestionName");
  const triggerValue = watch("sourceAnswer");
  const targetSlug = watch("targetQuestionName");

  // Only choice questions can be branch sources
  const branchableQuestions = useMemo(
    () => questions.filter((q) => BRANCHABLE_TYPES.has(q.type)),
    [questions]
  );

  const sourceQuestion = useMemo(
    () => branchableQuestions.find((q) => (q.slug ?? q.id) === sourceSlug) ?? null,
    [branchableQuestions, sourceSlug]
  );

  const sourceOptions = sourceQuestion?.options ?? [];

  // Target = all questions except source + cycle-creating ones
  const targetQuestions = useMemo(
    () =>
      questions.filter((q) => {
        const slug = q.slug ?? q.id;
        if (slug === sourceSlug) return false;
        if (sourceSlug && wouldCreateCycle(rules, sourceSlug, slug)) return false;
        return true;
      }),
    [questions, sourceSlug, rules]
  );

  const targetQuestion = useMemo(
    () => questions.find((q) => (q.slug ?? q.id) === targetSlug) ?? null,
    [questions, targetSlug]
  );

  // Reset downstream fields when source changes
  useEffect(() => {
    setValue("sourceAnswer", "");
    setValue("targetQuestionName", "");
  }, [sourceSlug, setValue]);

  // Preview sentence
  const preview = useMemo(() => {
    if (!sourceSlug || !triggerValue || !targetSlug) return null;
    const srcLabel = sourceQuestion?.text ?? sourceSlug;
    const optLabel =
      sourceOptions.find((o) => o.value === triggerValue)?.label ?? triggerValue;
    const tgtLabel = targetQuestion?.text ?? targetSlug;
    return { srcLabel, srcSlug: sourceSlug, optLabel, triggerValue, tgtLabel, tgtSlug: targetSlug };
  }, [sourceSlug, triggerValue, targetSlug, sourceQuestion, sourceOptions, targetQuestion]);

  const submit = handleSubmit(
    (values) => {
      onAdd(values);
      reset();
    },
    () => {
      // Validation failed — dropdowns not fully filled. Button should be disabled but guard here too.
    }
  );

  return (
    <section className={cn("rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5", className)}>
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--primary)]">
          <GitBranch className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-2xl text-[color:var(--text-primary)]">Branching rules</h3>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
            When a candidate answers a choice question with a specific value, unlock a follow-up question.
            Only single-choice and multiple-choice questions can be branch sources.
          </p>
        </div>
      </div>

      {/* Existing rules list */}
      <AnimatePresence initial={false}>
        {rules.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 space-y-2"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              Active rules ({rules.length})
            </p>
            {rules.map((rule, index) => {
              const srcQ = questions.find((q) => (q.slug ?? q.id) === rule.sourceQuestionName);
              const tgtQ = questions.find((q) => (q.slug ?? q.id) === rule.targetQuestionName);
              const optLabel =
                srcQ?.options.find((o) => o.value === rule.sourceAnswer)?.label ??
                rule.sourceAnswer;

              return (
                <motion.div
                  key={`${rule.sourceQuestionName}-${rule.sourceAnswer}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono text-[12px] text-[color:var(--text-muted)]">
                        {rule.sourceQuestionName}
                      </span>
                      <span className="text-[color:var(--text-muted)]">= </span>
                      <span className="rounded-full border border-[rgba(13,148,136,0.28)] bg-[rgba(13,148,136,0.1)] px-2 py-0.5 font-mono text-[11px] text-[color:var(--accent)]">
                        {optLabel}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--text-muted)]" />
                      <span className="font-mono text-[12px] text-[color:var(--primary)]">
                        {rule.targetQuestionName}
                      </span>
                    </div>
                    <div className="mt-0.5 flex gap-3 text-xs text-[color:var(--text-muted)]">
                      <span>{srcQ?.text ?? rule.sourceQuestionName}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 self-center" />
                      <span>{tgtQ?.text ?? rule.targetQuestionName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="focus-ring shrink-0 rounded-full p-2 text-[color:var(--text-muted)] transition hover:bg-[rgba(248,113,113,0.08)] hover:text-[color:var(--error)]"
                    aria-label="Remove rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* New rule form */}
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          New rule
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* 1. Source question */}
          <SelectField
            id="sourceQuestionName"
            label="Source question"
            value={sourceSlug}
            onChange={(v) => setValue("sourceQuestionName", v, { shouldValidate: true })}
            placeholder={
              branchableQuestions.length === 0
                ? "No choice questions yet"
                : "Pick a choice question"
            }
            disabled={branchableQuestions.length === 0}
            error={errors.sourceQuestionName?.message}
          >
            {branchableQuestions.map((q) => {
              const slug = q.slug ?? q.id;
              return (
                <option key={slug} value={slug}>
                  {slug} — {q.text}
                </option>
              );
            })}
          </SelectField>

          {/* 2. Trigger value — derived from source's options */}
          <SelectField
            id="sourceAnswer"
            label="Trigger value"
            value={triggerValue}
            onChange={(v) => setValue("sourceAnswer", v, { shouldValidate: true })}
            placeholder={sourceSlug ? "Pick a value" : "Select source first"}
            disabled={!sourceSlug || sourceOptions.length === 0}
            error={errors.sourceAnswer?.message}
          >
            {sourceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value} — {opt.label}
              </option>
            ))}
          </SelectField>

          {/* 3. Target question */}
          <SelectField
            id="targetQuestionName"
            label="Target question (unlocked)"
            value={targetSlug}
            onChange={(v) => setValue("targetQuestionName", v, { shouldValidate: true })}
            placeholder={sourceSlug ? "Pick a target" : "Select source first"}
            disabled={!sourceSlug || targetQuestions.length === 0}
            error={errors.targetQuestionName?.message}
          >
            {targetQuestions.map((q) => {
              const slug = q.slug ?? q.id;
              const count = inboundCount(rules, slug);
              return (
                <option key={slug} value={slug}>
                  {slug} — {q.text}
                  {count > 0 ? ` (${count} existing rule${count > 1 ? "s" : ""})` : ""}
                </option>
              );
            })}
          </SelectField>
        </div>

        {/* Live preview */}
        <AnimatePresence>
          {preview ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-xl border border-[rgba(13,148,136,0.24)] bg-[rgba(13,148,136,0.07)] px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-1.5">
                Preview
              </p>
              <p className="text-sm leading-6 text-[color:var(--text-primary)]">
                If{" "}
                <span className="font-semibold">
                  &ldquo;{preview.srcLabel}&rdquo;
                </span>{" "}
                is answered with{" "}
                <span className="mx-0.5 rounded-full border border-[rgba(13,148,136,0.3)] bg-[rgba(13,148,136,0.12)] px-2 py-0.5 font-mono text-[12px] text-[color:var(--accent)]">
                  {preview.optLabel}
                </span>
                , unlock{" "}
                <span className="font-semibold text-[color:var(--primary)]">
                  &ldquo;{preview.tgtLabel}&rdquo;
                </span>
              </p>
              <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-[color:var(--text-muted)]">
                <span>{preview.srcSlug}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{preview.triggerValue}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="text-[color:var(--primary)]">{preview.tgtSlug}</span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => reset()}
            className="text-sm text-[color:var(--text-muted)] transition hover:text-[color:var(--text-secondary)]"
          >
            Clear
          </button>
          <Button
            type="button"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={submit}
            disabled={!sourceSlug || !triggerValue || !targetSlug}
          >
            Add rule
          </Button>
        </div>
      </div>

      {/* Flow graph */}
      {(rules.length > 0 || questions.length > 0) ? (
        <RuleGraph rules={rules} questions={questions} />
      ) : null}

      {/* Save */}
      {rules.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[color:var(--text-muted)]">
            Rules are saved to the backend and take effect immediately for new survey sessions.
          </p>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            leftIcon={<GitMerge className="h-4 w-4" />}
            onClick={onSave}
            loading={saving}
          >
            Save all rules
          </Button>
        </div>
      ) : null}
    </section>
  );
}

// ─── Directed graph visualization ────────────────────────────────────────────

const NODE_W = 200;
const COL_GAP = 96;
const ROW_GAP = 20;
const LINE_H = 14;
const NODE_PAD = 12;

type GraphNode = {
  id: string;
  label: string;
  textLines: string[];
  slugLine: string;
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isBranchable: boolean;
};

function buildGraph(questions: Question[], rules: SurveyRule[]) {
  if (questions.length === 0) return { nodes: [], edges: [], width: 0, height: 0 };

  // Assign columns: 0 = always-visible (no inbound rules), 1+ = conditional
  const inboundMap = new Map<string, number>();
  for (const rule of rules) {
    inboundMap.set(rule.targetQuestionName, (inboundMap.get(rule.targetQuestionName) ?? 0) + 1);
  }

  // Group questions by whether they're branch targets
  const always = questions.filter((q) => !inboundMap.has(q.slug ?? q.id));
  const conditional = questions.filter((q) => inboundMap.has(q.slug ?? q.id));

  const nodes: GraphNode[] = [];
  let row = 0;

  for (const q of always) {
    const slug = q.slug ?? q.id;
    const textLines = wrapFlowText(q.text, 28, 2);
    const height = NODE_PAD * 2 + textLines.length * LINE_H + 14;
    nodes.push({
      id: slug,
      label: slug,
      textLines,
      slugLine: slug,
      col: 0,
      row: row++,
      x: 0,
      y: 0,
      width: NODE_W,
      height,
      isBranchable: BRANCHABLE_TYPES.has(q.type)
    });
  }

  const condRow = new Map<string, number>();
  for (const q of conditional) {
    const slug = q.slug ?? q.id;
    // Place it roughly at the row of its first source
    const srcRule = rules.find((r) => r.targetQuestionName === slug);
    const srcNode = srcRule ? nodes.find((n) => n.id === srcRule.sourceQuestionName) : null;
    const r = condRow.get(slug) ?? (srcNode ? srcNode.row : row++);
    condRow.set(slug, r);
    const textLines = wrapFlowText(q.text, 28, 2);
    const height = NODE_PAD * 2 + textLines.length * LINE_H + 14;
    nodes.push({
      id: slug,
      label: slug,
      textLines,
      slugLine: slug,
      col: 1,
      row: r,
      x: 0,
      y: 0,
      width: NODE_W,
      height,
      isBranchable: BRANCHABLE_TYPES.has(q.type)
    });
  }

  const rowHeights = new Map<number, number>();
  nodes.forEach((node) => {
    rowHeights.set(node.row, Math.max(rowHeights.get(node.row) ?? 0, node.height));
  });

  const rowCount = Math.max(...nodes.map((n) => n.row), 0) + 1;
  const rowOffsets: number[] = [];
  let yCursor = 16;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    rowOffsets[rowIndex] = yCursor;
    yCursor += (rowHeights.get(rowIndex) ?? 56) + ROW_GAP;
  }

  nodes.forEach((n) => {
    n.x = n.col * (NODE_W + COL_GAP) + 16;
    const rowHeight = rowHeights.get(n.row) ?? n.height;
    n.y = rowOffsets[n.row] + (rowHeight - n.height) / 2;
  });

  const svgW = nodes.length > 0 ? Math.max(...nodes.map((n) => n.x + n.width)) + 24 : 200;
  const svgH = yCursor + 8;

  // Build edges
  const edges = rules.map((rule) => {
    const src = nodes.find((n) => n.id === rule.sourceQuestionName);
    const tgt = nodes.find((n) => n.id === rule.targetQuestionName);
    return src && tgt ? { src, tgt, label: rule.sourceAnswer } : null;
  }).filter(Boolean) as { src: GraphNode; tgt: GraphNode; label: string }[];

  return { nodes, edges, width: svgW, height: svgH };
}

function RuleGraph({ rules, questions }: { rules: SurveyRule[]; questions: Question[] }) {
  const { nodes, edges, width, height } = useMemo(
    () => buildGraph(questions, rules),
    [questions, rules]
  );

  if (nodes.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
        Flow diagram
      </p>
      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)]">
        <svg
          width={width}
          height={height}
          className="block"
          style={{ minWidth: width }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(13,148,136,0.7)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map(({ src, tgt, label }, i) => {
            const x1 = src.x + src.width;
            const y1 = src.y + src.height / 2;
            const x2 = tgt.x;
            const y2 = tgt.y + tgt.height / 2;
            const mx = (x1 + x2) / 2;
            const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
            const labelLines = wrapFlowText(label, 16, 2);
            const labelWidth = Math.min(120, Math.max(56, labelLines[0].length * 6.5));
            const labelHeight = labelLines.length * 12 + 8;

            return (
              <g key={i}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke="rgba(13,148,136,0.55)"
                  strokeWidth={1.5}
                  markerEnd="url(#arrow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                />
                <foreignObject
                  x={mx - labelWidth / 2}
                  y={(y1 + y2) / 2 - labelHeight / 2}
                  width={labelWidth}
                  height={labelHeight}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "1px",
                      minHeight: "100%",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      border: "1px solid rgba(13,148,136,0.35)",
                      background: "rgba(6,10,9,0.92)",
                      textAlign: "center"
                    }}
                  >
                    {labelLines.map((line, lineIndex) => (
                      <span
                        key={`${i}-${lineIndex}`}
                        style={{
                          fontSize: "9px",
                          lineHeight: 1.25,
                          color: "rgba(16,185,129,0.95)",
                          fontFamily: "var(--font-mono)",
                          wordBreak: "break-word"
                        }}
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, delay: i * 0.04 }}
            >
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={10}
                fill={node.isBranchable ? "rgba(13,148,136,0.16)" : "rgba(17,29,24,0.9)"}
                stroke={node.isBranchable ? "rgba(13,148,136,0.5)" : "rgba(13,148,136,0.18)"}
                strokeWidth={1}
              />
              <foreignObject x={node.x} y={node.y} width={node.width} height={node.height}>
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "10px 12px",
                    boxSizing: "border-box",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      color: "rgba(13,148,136,0.9)",
                      overflowWrap: "anywhere",
                      wordBreak: "break-all"
                    }}
                  >
                    {node.slugLine}
                  </div>
                  <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "1px" }}>
                    {node.textLines.map((line, lineIndex) => (
                      <span
                        key={`${node.id}-${lineIndex}`}
                        style={{
                          fontSize: "11px",
                          lineHeight: 1.3,
                          color: "rgba(232,245,242,0.82)",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word"
                        }}
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
              </foreignObject>
            </motion.g>
          ))}
        </svg>
      </div>
    </div>
  );
}
