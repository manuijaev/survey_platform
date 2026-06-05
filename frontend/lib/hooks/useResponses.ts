"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { surveyApi } from "@/lib/api";
import { toastService } from "@/lib/toast-service";
import { surveyKeys } from "./useSurveys";
import type { SurveyResponseSummary } from "@/types/survey";

export type ResponseFilters = {
  email?: string;
  page?: number;
  size?: number;
};

export const responseKeys = {
  list: (surveyId: string, filters: ResponseFilters) => ["responses", surveyId, filters] as const
};

export function useResponses(surveyId?: string, filters: ResponseFilters = {}) {
  return useQuery({
    queryKey: responseKeys.list(surveyId ?? "", filters),
    enabled: Boolean(surveyId),
    queryFn: async () => {
      if (!surveyId) return [] as SurveyResponseSummary[];
      return surveyApi.getResponses(surveyId, filters);
    },
    placeholderData: keepPreviousData
  });
}

export function useResponsesActions(surveyId?: string) {
  const queryClient = useQueryClient();

  const refresh = async () => {
    if (!surveyId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: surveyKeys.responses(surveyId) }),
      queryClient.invalidateQueries({ queryKey: surveyKeys.all })
    ]);
  };

  const downloadCertificate = useMutation({
    mutationFn: async (payload: { id: string; filename: string }) => {
      toastService.info("Downloading certificate", `${payload.filename} is being prepared.`);
      const response = await surveyApi.downloadCertificate(payload.id);
      const blob = response.data as Blob;
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = payload.filename;
      anchor.click();
      URL.revokeObjectURL(href);
      return response;
    },
    onError: (_, payload) => {
      toastService.error("Download failed", "The certificate file could not be retrieved. Contact an administrator.");
      if (payload?.filename) {
        void payload.filename;
      }
    }
  });

  return { downloadCertificate, refresh };
}
