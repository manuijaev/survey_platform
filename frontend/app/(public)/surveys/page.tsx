import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { surveyApi } from "@/lib/api";
import { surveyKeys } from "@/lib/hooks/useSurveys";
import PublicSurveysClient from "./PublicSurveysClient";

export default async function PublicSurveysPage() {
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: surveyKeys.all,
      queryFn: surveyApi.getSurveys
    });
  } catch {
    // Client will refetch if the backend was still cold during SSR.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PublicSurveysClient />
    </HydrationBoundary>
  );
}
