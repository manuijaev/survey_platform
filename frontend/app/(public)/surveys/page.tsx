"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { BioluminescentBackdrop } from "@/components/survey/BioluminescentBackdrop";
import { SurveyCard } from "@/components/survey/SurveyCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSurveys } from "@/lib/hooks";

function SurveyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="mt-5 h-7 w-4/5 rounded-lg" />
      <Skeleton className="mt-4 h-4 w-full rounded-lg" />
      <Skeleton className="mt-3 h-4 w-11/12 rounded-lg" />
      <Skeleton className="mt-6 h-8 w-32 rounded-full" />
    </div>
  );
}

export default function PublicSurveysPage() {
  const surveysQuery = useSurveys();
  const surveys = surveysQuery.data ?? [];

  const hasSurveys = surveys.length > 0;
  const cards = useMemo(() => Array.from({ length: 6 }), []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BioluminescentBackdrop className="h-full" />

      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-28">
        <div className="max-w-3xl">
          <div className="text-sm uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Survey collection</div>
          <h1 className="mt-4 font-display text-5xl italic text-[color:var(--text-primary)] sm:text-6xl">
            Find Your Survey
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[color:var(--text-secondary)]">
            Browse active surveys, review the details, and enter responses through a calm, guided flow.
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {surveysQuery.isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((_, index) => (
              <SurveyCardSkeleton key={index} />
            ))}
          </div>
        ) : hasSurveys ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {surveys.map((survey, index) => (
              <motion.div
                key={survey.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.06 }}
              >
                <SurveyCard survey={survey} mode="public" />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing here yet"
            description="Create your first survey to get started."
            actionLabel="Refresh"
            onAction={() => surveysQuery.refetch()}
          />
        )}
      </section>
    </div>
  );
}
