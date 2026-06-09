"use client";

import { useMutation } from "@tanstack/react-query";
import { surveyApi } from "@/lib/api";
import { toastService } from "@/lib/toast-service";
import type { SurveySubmissionPayload } from "@/types/response";

export function useNextQuestion() {
  return useMutation({
    mutationFn: ({
      surveyId,
      answeredQuestions,
      lastAnswers
    }: {
      surveyId: string;
      answeredQuestions: string[];
      lastAnswers: Record<string, string | number>;
    }) => surveyApi.getNextQuestion(surveyId, answeredQuestions, lastAnswers)
  });
}

export function useSubmitSurveyResponse() {
  return useMutation({
    mutationFn: (payload: SurveySubmissionPayload) => surveyApi.submitSurveyResponse(payload),
    onSuccess: () => {
      toastService.success("Response received", "Your submission has been recorded. Thank you.");
    },
    onError: () => {
      toastService.error(
        "Submission failed",
        "We couldn't save your response. Please check your connection and try again."
      );
    }
  });
}
