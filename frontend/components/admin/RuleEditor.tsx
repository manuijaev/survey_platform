"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { ruleSchema, type RuleFormValues } from "@/lib/validators/rule";
import type { SurveyRule } from "@/types/rule";

export function RuleEditor({
  rules,
  onAdd,
  onRemove,
  onSave,
  className
}: {
  rules: SurveyRule[];
  onAdd: (rule: SurveyRule) => void;
  onRemove: (index: number) => void;
  onSave: () => void;
  className?: string;
}) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      sourceQuestionId: "",
      sourceAnswer: "",
      targetQuestionId: "",
      comparator: "equals"
    }
  });

  return (
    <section className={cn("rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5", className)}>
      <div className="mb-4">
        <h3 className="font-display text-2xl text-[color:var(--text-primary)]">Rule editor</h3>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Map answers to the next question in the flow.</p>
      </div>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div key={`${rule.sourceQuestionId}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-3">
            <div className="min-w-0">
              <div className="font-mono text-sm text-[color:var(--text-primary)]">{rule.sourceQuestionId}</div>
              <div className="mt-1 text-sm text-[color:var(--text-secondary)]">
                {rule.comparator ?? "equals"} {rule.sourceAnswer} → {rule.targetQuestionId}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="focus-ring rounded-full p-2 text-[color:var(--text-muted)] transition hover:bg-[color:var(--bg-subtle)] hover:text-[color:var(--error)]"
              aria-label="Remove rule"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <form
        className="mt-5 grid gap-4 md:grid-cols-2"
        onSubmit={handleSubmit((values) => {
          onAdd(values);
          reset();
        })}
      >
        <Input label="Source question" placeholder="question_id" {...register("sourceQuestionId")} error={errors.sourceQuestionId?.message} />
        <Input label="Source answer" placeholder="answer value" {...register("sourceAnswer")} error={errors.sourceAnswer?.message} />
        <Input label="Target question" placeholder="next_question_id" {...register("targetQuestionId")} error={errors.targetQuestionId?.message} />
        <Select label="Comparator" {...register("comparator")} error={errors.comparator?.message}>
          <option value="equals">Equals</option>
          <option value="contains">Contains</option>
          <option value="greaterThan">Greater than</option>
          <option value="lessThan">Less than</option>
        </Select>
        <div className="md:col-span-2 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => reset()}>
            Clear
          </Button>
          <Button type="submit" leftIcon={<Plus className="h-4 w-4" />} loading={isSubmitting}>
            Add rule
          </Button>
        </div>
      </form>

      <div className="mt-5 flex items-center justify-end">
        <Button type="button" variant="outline" onClick={onSave}>
          Save rules
        </Button>
      </div>
    </section>
  );
}
