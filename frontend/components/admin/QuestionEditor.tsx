"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { cn, slugify } from "@/lib/utils";
import { questionSchema, type QuestionFormValues } from "@/lib/validators/question";
import type { Question, QuestionPayload, QuestionType } from "@/types/question";
import { OptionManager } from "./OptionManager";

const questionTypes: Array<{ value: QuestionType; label: string }> = [
  { value: "SHORT_TEXT", label: "Short Text" },
  { value: "LONG_TEXT", label: "Long Text" },
  { value: "EMAIL", label: "Email" },
  { value: "SINGLE_CHOICE", label: "Single Choice" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "FILE_UPLOAD", label: "File Upload" },
  { value: "NUMBER", label: "Number" },
  { value: "SYSTEM_DESIGN", label: "System Design" }
];

const defaultValues: QuestionFormValues = {
  name: "",
  text: "",
  description: "",
  type: "SHORT_TEXT",
  required: false,
  options: [],
  allowMultipleSelections: false,
  fileFormat: "",
  maxFileSizeMb: undefined,
  multipleFiles: false,
  minNumber: undefined,
  maxNumber: undefined
};

export function QuestionEditor({
  open,
  onClose,
  surveyId,
  initialQuestion,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  surveyId: string;
  initialQuestion?: Question | null;
  onSave: (payload: QuestionPayload) => Promise<void> | void;
}) {
  const autoSlugRef = useRef("");
  const previousTypeRef = useRef<QuestionType | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options"
  });

  const type = watch("type");
  const name = watch("name");
  const text = watch("text");
  const isChoice = type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
  const isFile = type === "FILE_UPLOAD";
  const isNumber = type === "NUMBER";
  const isSystemDesign = type === "SYSTEM_DESIGN";

  useEffect(() => {
    const previousType = previousTypeRef.current;
    previousTypeRef.current = type;

    if (type === "FILE_UPLOAD") {
      if (!getValues("fileFormat")?.trim()) {
        setValue("fileFormat", ".pdf", { shouldValidate: true });
      }
      const currentMax = getValues("maxFileSizeMb");
      if (currentMax === undefined || Number.isNaN(currentMax)) {
        setValue("maxFileSizeMb", 1, { shouldValidate: true });
      }
      return;
    }

    if (previousType === "FILE_UPLOAD") {
      setValue("fileFormat", "");
      setValue("maxFileSizeMb", undefined);
      setValue("multipleFiles", false);
    }
  }, [type, setValue, getValues]);

  useEffect(() => {
    if (!open) {
      previousTypeRef.current = null;
      return;
    }

    if (initialQuestion) {
      const nextValues: QuestionFormValues = {
        name: initialQuestion.slug ?? initialQuestion.id,
        text: initialQuestion.text,
        description: initialQuestion.description ?? "",
        type: initialQuestion.type,
        required: initialQuestion.required,
        options: initialQuestion.options.length
          ? initialQuestion.options.map((option) => ({ value: option.value, label: option.label }))
          : [],
        allowMultipleSelections: initialQuestion.allowMultipleSelections ?? false,
        fileFormat:
          initialQuestion.type === "FILE_UPLOAD" ? (initialQuestion.fileFormat ?? ".pdf") : "",
        maxFileSizeMb:
          initialQuestion.type === "FILE_UPLOAD" ? (initialQuestion.maxFileSizeMb ?? 1) : undefined,
        multipleFiles:
          initialQuestion.type === "FILE_UPLOAD" ? (initialQuestion.multipleFiles ?? false) : false,
        minNumber: initialQuestion.minNumber,
        maxNumber: initialQuestion.maxNumber
      };
      autoSlugRef.current = nextValues.name;
      reset(nextValues);
      return;
    }

    autoSlugRef.current = "";
    reset(defaultValues);
  }, [initialQuestion, open, reset]);

  const title = initialQuestion ? "Edit Question" : "Add Question";

  const onTextChange = (value: string) => {
    const nextSlug = slugify(value);
    const currentSlug = getValues("name");
    if (!currentSlug || currentSlug === autoSlugRef.current) {
      setValue("name", nextSlug, { shouldValidate: true });
      autoSlugRef.current = nextSlug;
    }
  };

  const submit = handleSubmit(async (values) => {
    await onSave(values);
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="drawer"
      title={title}
      description={`Survey ${surveyId}`}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} loading={isSubmitting}>
            Save Question
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
        <section className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
            Question Basics
          </h3>
          <div className="space-y-1.5">
            <Input label="Slug" placeholder="question_slug" {...register("name")} error={errors.name?.message} />
            {!errors.name && (
              <p className="text-xs text-[color:var(--text-muted)]">
                Auto-filled from question text. Lowercase letters, numbers and underscores only.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="type" className="text-sm font-medium text-[color:var(--text-primary)]">
              Type
            </label>
            <Select id="type" {...register("type")} error={errors.type?.message}>
              {questionTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="button"
            onClick={() => setValue("required", !watch("required"))}
            className={cn(
              "focus-ring inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition",
              watch("required")
                ? "border-[color:var(--primary)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--bg-subtle)] text-[color:var(--text-secondary)]"
            )}
          >
            {watch("required") ? <ToggleRight className="h-4 w-4 text-[color:var(--accent)]" /> : <ToggleLeft className="h-4 w-4" />}
            Required
          </button>
        </section>

        <section className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
            Question Content
          </h3>
          <Input
            label="Text"
            placeholder="What is your preferred stack?"
            {...register("text", {
              onChange: (event) => onTextChange(event.target.value)
            })}
            error={errors.text?.message}
          />
          <Textarea
            label="Description"
            placeholder="Add any additional context."
            rows={4}
            {...register("description")}
            error={errors.description?.message}
          />
        </section>

        {isChoice ? (
          <section className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              Options Panel
            </h3>
            <OptionManager fields={fields} register={register} append={append} remove={remove} errors={errors} />
            <button
              type="button"
              onClick={() => setValue("allowMultipleSelections", !watch("allowMultipleSelections"))}
              className={cn(
                "focus-ring inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition",
                watch("allowMultipleSelections")
                  ? "border-[color:var(--primary)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)]"
                  : "border-[color:var(--border)] bg-[color:var(--bg-subtle)] text-[color:var(--text-secondary)]"
              )}
            >
              {watch("allowMultipleSelections") ? "Multiple selections on" : "Multiple selections off"}
            </button>
          </section>
        ) : null}

        {isFile ? (
          <section className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              File Properties
            </h3>
            <Input label="Format" placeholder=".pdf" {...register("fileFormat")} error={errors.fileFormat?.message} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Max file size"
                type="number"
                min={1}
                max={100}
                step={1}
                suffix="MB"
                {...register("maxFileSizeMb", { valueAsNumber: true })}
                error={errors.maxFileSizeMb?.message}
              />
              <button
                type="button"
                onClick={() => setValue("multipleFiles", !watch("multipleFiles"))}
                className={cn(
                  "focus-ring mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm transition",
                  watch("multipleFiles")
                    ? "border-[color:var(--primary)] bg-[rgba(13,148,136,0.14)] text-[color:var(--text-primary)]"
                    : "border-[color:var(--border)] bg-[color:var(--bg-subtle)] text-[color:var(--text-secondary)]"
                )}
              >
                {watch("multipleFiles") ? "Multiple uploads enabled" : "Single upload only"}
              </button>
            </div>
          </section>
        ) : null}

        {isNumber ? (
          <section className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              Number Properties
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Min value"
                type="number"
                {...register("minNumber", { valueAsNumber: true })}
                error={errors.minNumber?.message}
              />
              <Input
                label="Max value"
                type="number"
                {...register("maxNumber", { valueAsNumber: true })}
                error={errors.maxNumber?.message}
              />
            </div>
          </section>
        ) : null}

        {isSystemDesign ? (
          <section className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                Sub-parts
              </h3>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                Break the question into focused sections. Each sub-part gets its own answer field.
                Leave empty for a single open-ended answer.
              </p>
            </div>
            <OptionManager
              fields={fields}
              register={register}
              append={append}
              remove={remove}
              errors={errors}
              valuePlaceholder="part_slug"
              labelPlaceholder="e.g. Describe the architecture"
            />
          </section>
        ) : null}

      </form>
    </Modal>
  );
}
