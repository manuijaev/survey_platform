"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { surveyApi } from "@/lib/api";
import { toastService } from "@/lib/toast-service";
import { surveyKeys } from "./useSurveys";
import type { Question, QuestionPayload } from "@/types/question";

export const questionKeys = {
  all: ["questions"] as const,
  list: (surveyId: string) => ["questions", surveyId] as const
};

export function useQuestions(surveyId?: string) {
  return useQuery({
    queryKey: questionKeys.list(surveyId ?? ""),
    enabled: Boolean(surveyId),
    queryFn: async () => {
      if (!surveyId) return [] as Question[];
      return surveyApi.getQuestions(surveyId);
    }
  });
}

export function useQuestionMutations(surveyId?: string) {
  const queryClient = useQueryClient();

  const refresh = async () => {
    if (!surveyId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: questionKeys.list(surveyId) }),
      queryClient.invalidateQueries({ queryKey: surveyKeys.all })
    ]);
  };

  const createQuestion = useMutation({
    mutationFn: (payload: QuestionPayload) => {
      if (!surveyId) throw new Error("Missing survey id");
      return surveyApi.createQuestion(surveyId, payload);
    },
    onSuccess: async (_, payload) => {
      toastService.success("Question added", `"${payload.text}" is now part of this survey.`);
      await refresh();
    }
  });

  const updateQuestion = useMutation({
    mutationFn: ({ questionId, payload }: { questionId: string; payload: QuestionPayload }) => {
      if (!surveyId) throw new Error("Missing survey id");
      return surveyApi.updateQuestion(surveyId, questionId, payload);
    },
    onSuccess: async () => {
      toastService.success("Question updated", "Changes to this question are now live.");
      await refresh();
    }
  });

  const deleteQuestion = useMutation({
    mutationFn: (questionId: string) => {
      if (!surveyId) throw new Error("Missing survey id");
      return surveyApi.deleteQuestion(surveyId, questionId);
    },
    onSuccess: async () => {
      toastService.success("Question removed", "This question will no longer appear in responses.");
      await refresh();
    }
  });

  const reorderQuestions = useMutation({
    mutationFn: (questionIds: string[]) => {
      if (!surveyId) throw new Error("Missing survey id");
      return surveyApi.reorderQuestions(surveyId, questionIds);
    },
    onSuccess: async () => {
      toastService.success("Order saved", "Question sequence updated.");
      await refresh();
    }
  });

  return { createQuestion, updateQuestion, deleteQuestion, reorderQuestions };
}
