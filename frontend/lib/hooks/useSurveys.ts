"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { surveyApi } from "@/lib/api";
import { toastService } from "@/lib/toast-service";
import type { Survey, SurveyPayload } from "@/types/survey";

export const surveyKeys = {
  all: ["surveys"] as const,
  detail: (id: string) => ["surveys", id] as const,
  questions: (id: string) => ["surveys", id, "questions"] as const,
  responses: (id: string) => ["surveys", id, "responses"] as const
};

export function useSurveys() {
  return useQuery({
    queryKey: surveyKeys.all,
    queryFn: surveyApi.getSurveys
  });
}

export function useSurvey(surveyId?: string) {
  return useQuery({
    queryKey: surveyKeys.detail(surveyId ?? ""),
    enabled: Boolean(surveyId),
    queryFn: async () => {
      const surveys = await surveyApi.getSurveys();
      return surveys.find((survey) => survey.id === surveyId) ?? null;
    }
  });
}

export function useSurveyMutations() {
  const queryClient = useQueryClient();

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: surveyKeys.all });
  };

  const createSurvey = useMutation({
    mutationFn: (payload: SurveyPayload) => surveyApi.createSurvey(payload),
    onSuccess: async () => {
      toastService.success("Survey created", "Your survey is ready to receive questions.");
      await refresh();
    },
    onError: () => {
      toastService.error(
        "Could not create survey",
        "Check your inputs and try again. If this persists, the server may be unavailable."
      );
    }
  });

  const updateSurvey = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SurveyPayload }) =>
      surveyApi.updateSurvey(id, payload),
    onSuccess: async () => {
      toastService.success("Survey updated", "Changes saved successfully.");
      await refresh();
    }
  });

  const deleteSurvey = useMutation({
    mutationFn: (id: string) => surveyApi.deleteSurvey(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: surveyKeys.all });
      const previous = queryClient.getQueryData<Survey[]>(surveyKeys.all) ?? [];
      queryClient.setQueryData<Survey[]>(surveyKeys.all, previous.filter((survey) => survey.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(surveyKeys.all, context.previous);
      }
    },
    onSuccess: async () => {
      toastService.success("Survey removed", "This survey has been permanently deleted.");
      await refresh();
    }
  });

  return { createSurvey, updateSurvey, deleteSurvey };
}

export function useSurveyListItem(surveyId?: string) {
  const survey = useSurvey(surveyId);
  const fallback = survey.data ?? null;
  return fallback as Survey | null;
}
