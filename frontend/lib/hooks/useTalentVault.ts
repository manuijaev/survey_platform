"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { surveyApi, type PaginatedResponses } from "@/lib/api";
import { toastService } from "@/lib/toast-service";
import type { SurveyResponseSummary } from "@/types/survey";
import type { ResponseFilters } from "./useResponses";

function patchResponseLists(
  queryClient: ReturnType<typeof useQueryClient>,
  surveyId: string,
  responseId: string,
  shortlisted: boolean,
  vaultCount: number
) {
  const queries = queryClient.getQueriesData<PaginatedResponses>({
    queryKey: ["responses", surveyId]
  });

  for (const [key, data] of queries) {
    if (!data) continue;
    const filters = (key[2] ?? {}) as ResponseFilters;
    const isVaultView = Boolean(filters.shortlisted);

    let items = data.items.map((item) =>
      item.id === responseId ? { ...item, shortlisted } : item
    );

    if (isVaultView && !shortlisted) {
      items = items.filter((item) => item.id !== responseId);
    }

    queryClient.setQueryData<PaginatedResponses>(key, {
      ...data,
      items,
      totalCount: isVaultView && !shortlisted ? Math.max(0, data.totalCount - 1) : data.totalCount
    });
  }

  queryClient.setQueryData<number>(["talent-vault-count", surveyId], vaultCount);
}

export function useTalentVault(surveyId?: string) {
  const queryClient = useQueryClient();

  const toggleVault = useMutation({
    mutationFn: async ({
      response,
      nextShortlisted
    }: {
      response: SurveyResponseSummary;
      nextShortlisted: boolean;
    }) => {
      if (!surveyId) throw new Error("Missing survey id");
      if (nextShortlisted) {
        return surveyApi.addToTalentVault(surveyId, response.id);
      }
      return surveyApi.removeFromTalentVault(surveyId, response.id);
    },
    onMutate: async ({ response, nextShortlisted }) => {
      await queryClient.cancelQueries({ queryKey: ["responses", surveyId] });
      const previous = queryClient.getQueriesData({ queryKey: ["responses", surveyId] });
      const currentCount = queryClient.getQueryData<number>(["talent-vault-count", surveyId]) ?? 0;
      const optimisticCount = nextShortlisted
        ? currentCount + (response.shortlisted ? 0 : 1)
        : Math.max(0, currentCount - (response.shortlisted ? 1 : 0));

      patchResponseLists(queryClient, surveyId!, response.id, nextShortlisted, optimisticCount);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toastService.error("Vault update failed", "Could not update the talent vault. Try again.");
    },
    onSuccess: (result, { nextShortlisted }) => {
      patchResponseLists(
        queryClient,
        surveyId!,
        result.responseId,
        result.shortlisted,
        result.vaultCount
      );
      toastService.success(
        nextShortlisted ? "Saved to talent vault" : "Removed from vault",
        nextShortlisted
          ? "Candidate archived for future reference."
          : "Candidate removed from your vault."
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["responses", surveyId] });
      queryClient.invalidateQueries({ queryKey: ["talent-vault-count", surveyId] });
    }
  });

  return { toggleVault };
}
