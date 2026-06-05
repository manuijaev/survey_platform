"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { surveySchema, type SurveyFormValues } from "@/lib/validators/survey";
import type { Survey } from "@/types/survey";

const defaultValues: SurveyFormValues = {
  name: "",
  description: ""
};

export function SurveyEditor({
  open,
  onClose,
  initialSurvey,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  initialSurvey?: Survey | null;
  onSave: (values: SurveyFormValues) => Promise<void> | void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues
  });

  useEffect(() => {
    if (initialSurvey) {
      reset({
        name: initialSurvey.name,
        description: initialSurvey.description ?? ""
      });
      return;
    }
    reset(defaultValues);
  }, [initialSurvey, open, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialSurvey ? "Edit Survey" : "Create Survey"}
      description="Define the survey name and description."
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit(onSave)} loading={isSubmitting}>
            Save Survey
          </Button>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <Input label="Name" placeholder="Customer feedback survey" {...register("name")} error={errors.name?.message} />
        <Textarea
          label="Description"
          placeholder="Optional context for participants and administrators."
          rows={5}
          {...register("description")}
          error={errors.description?.message}
        />
      </form>
    </Modal>
  );
}
