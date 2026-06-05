"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toastService } from "@/lib/toast-service";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ChoiceGroup } from "./ChoiceGroup";
import { FileUploadZone } from "./FileUploadZone";
import type { Question } from "@/types/question";
import { z } from "zod";

function buildSchema(question: Question) {
  const choiceSchema = question.type === "MULTIPLE_CHOICE" ? z.array(z.string()) : z.string();
  const base =
    question.type === "SHORT_TEXT" || question.type === "LONG_TEXT" || question.type === "EMAIL"
      ? z.object({
          answer: z.string()
        })
      : question.type === "FILE_UPLOAD"
        ? z.object({
            files: z.array(z.instanceof(File))
          })
        : z.object({
            answer: choiceSchema
          });

  return base.superRefine((value, ctx) => {
    if (question.type === "FILE_UPLOAD") {
      const files = (value as { files: File[] }).files;
      if (question.required && files.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["files"],
          message: "Please attach at least one PDF file."
        });
      }
      return;
    }

    const answer = (value as { answer: string | string[] }).answer;
    const empty = Array.isArray(answer) ? answer.length === 0 : answer.trim().length === 0;
    if (question.required && empty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answer"],
        message: "Please fill in this field before continuing."
      });
    }

    if (question.type === "EMAIL" && typeof answer === "string" && answer.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answer"],
        message: "Enter a valid email address."
      });
    }
  });
}

export type QuestionStepValue = {
  answer?: string | string[];
  files?: File[];
};

export function QuestionInputForm({
  question,
  formId,
  defaultValue,
  onValidSubmit,
  onInvalidSubmit
}: {
  question: Question;
  formId: string;
  defaultValue?: QuestionStepValue;
  onValidSubmit: (value: Required<QuestionStepValue>) => void;
  onInvalidSubmit?: (message: string) => void;
}) {
  const schema = useMemo(() => buildSchema(question), [question]);

  const { register, control, handleSubmit, formState: { errors } } = useForm<QuestionStepValue>({
    resolver: zodResolver(schema),
    defaultValues: {
      answer: defaultValue?.answer ?? (question.type === "MULTIPLE_CHOICE" ? [] : ""),
      files: defaultValue?.files ?? []
    }
  });

  const onSubmit = handleSubmit(
    async (values) => {
      if (question.type === "FILE_UPLOAD") {
        await onValidSubmit({ answer: "", files: values.files ?? [] });
        return;
      }

      await onValidSubmit({
        answer: values.answer ?? "",
        files: []
      });
    },
    (submissionErrors) => {
      const firstMessage =
        submissionErrors.answer?.message ||
        submissionErrors.files?.message ||
        "Please fill in all required fields before saving.";
      toastService.error("Required field missing", "Please fill in all required fields before saving.");
      onInvalidSubmit?.(String(firstMessage));
    }
  );

  const answerError = errors.answer?.message;
  const fileError = errors.files?.message;

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-5">
      {question.type === "SHORT_TEXT" || question.type === "EMAIL" ? (
        <Input
          type={question.type === "EMAIL" ? "email" : "text"}
          label={question.type === "EMAIL" ? "Email" : undefined}
          placeholder={question.type === "EMAIL" ? "name@example.com" : "Type your answer"}
          {...register("answer")}
          error={answerError}
        />
      ) : null}

      {question.type === "LONG_TEXT" ? (
        <Textarea
          autoResize
          rows={3}
          placeholder="Type your response"
          {...register("answer")}
          error={answerError}
        />
      ) : null}

      {question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE" ? (
        <Controller
          control={control}
          name="answer"
          render={({ field }) => (
            <ChoiceGroup
              name={question.text}
              options={question.options.map((option) => ({ value: option.value, label: option.label }))}
              multiple={question.type === "MULTIPLE_CHOICE" || Boolean(question.allowMultipleSelections)}
              value={field.value ?? (question.type === "MULTIPLE_CHOICE" ? [] : "")}
              onChange={field.onChange}
              error={answerError}
            />
          )}
        />
      ) : null}

      {question.type === "FILE_UPLOAD" ? (
        <Controller
          control={control}
          name="files"
          render={({ field }) => (
            <FileUploadZone
              files={field.value ?? []}
              onChange={field.onChange}
              multiple={Boolean(question.multipleFiles)}
              maxFileSizeMb={question.maxFileSizeMb ?? 1}
            />
          )}
        />
      ) : null}

      {fileError ? <p className="text-sm text-[color:var(--error)]">{String(fileError)}</p> : null}
    </form>
  );
}
