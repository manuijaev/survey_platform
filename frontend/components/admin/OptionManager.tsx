"use client";

import { Plus, Trash2 } from "lucide-react";
import type { FieldErrors, UseFieldArrayAppend, UseFieldArrayRemove, UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { QuestionFormValues } from "@/lib/validators/question";

export function OptionManager({
  fields,
  register,
  append,
  remove,
  errors,
  className
}: {
  fields: Array<{ id: string } & Record<string, unknown>>;
  register: UseFormRegister<QuestionFormValues>;
  append: UseFieldArrayAppend<QuestionFormValues, "options">;
  remove: UseFieldArrayRemove;
  errors: FieldErrors<QuestionFormValues>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4"
          >
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Input label="Value" placeholder="answer_value" {...register(`options.${index}.value`)} />
              <Input label="Display label" placeholder="Answer label" {...register(`options.${index}.label`)} />
              <button
                type="button"
                onClick={() => remove(index)}
                className="focus-ring mt-6 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:border-[color:var(--error)] hover:bg-[rgba(248,113,113,0.08)] hover:text-[color:var(--error)]"
                aria-label={`Remove option ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {errors.options?.message ? (
        <p className="text-sm text-[color:var(--error)]">{String(errors.options.message)}</p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => append({ value: "", label: "" } as QuestionFormValues["options"][number])}
      >
        Add Option
      </Button>
    </div>
  );
}
