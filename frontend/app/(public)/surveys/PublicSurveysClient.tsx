"use client";

import { useEffect, useMemo, useState } from "react";
import { BioluminescentBackdrop } from "@/components/survey/BioluminescentBackdrop";
import { SurveyCard } from "@/components/survey/SurveyCard";
import cardStyles from "@/components/survey/SurveyCard.module.css";
import { SurveyCardMotion } from "@/components/survey/SurveyCardMotion";
import { EmptyState } from "@/components/ui/EmptyState";
import { SurveyCardSkeleton } from "@/components/survey/SurveyCardSkeleton";
import { useSurveys } from "@/lib/hooks";

const SLOW_LOAD_MS = 3500;

export default function PublicSurveysClient() {
  const surveysQuery = useSurveys();
  const surveys = surveysQuery.data ?? [];
  const loadFailed = surveysQuery.isError && !surveysQuery.isLoading;
  const [slowLoad, setSlowLoad] = useState(false);

  const hasSurveys = surveys.length > 0;
  const cards = useMemo(() => Array.from({ length: 6 }), []);

  useEffect(() => {
    if (!surveysQuery.isLoading) {
      setSlowLoad(false);
      return;
    }

    const timer = window.setTimeout(() => setSlowLoad(true), SLOW_LOAD_MS);
    return () => window.clearTimeout(timer);
  }, [surveysQuery.isLoading]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <BioluminescentBackdrop className="h-full" />

      <section className="survey-hero relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
        <div className="max-w-3xl">
          <div className="text-sm uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Survey collection</div>
          <h1 className="mt-4 font-display text-4xl italic text-[color:var(--text-primary)] sm:text-5xl lg:text-6xl">
            Find Your Survey
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[color:var(--text-secondary)]">
            Browse active surveys, review the details, and enter responses through a calm, guided flow.
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl overflow-visible px-4 pb-20 sm:px-6 lg:px-8">
        {surveysQuery.isLoading ? (
          <>
            {slowLoad ? (
              <p className="mb-6 text-center text-sm text-[color:var(--text-muted)]">
                Starting the server — first load can take up to a minute if the API was idle.
              </p>
            ) : null}
            <div className={cardStyles.cardGrid}>
              {cards.map((_, index) => (
                <SurveyCardSkeleton key={index} />
              ))}
            </div>
          </>
        ) : loadFailed ? (
          <EmptyState
            title="Could not load surveys"
            description="The app could not reach the survey API. If you just deployed, confirm API_URL is set on Vercel to your Render backend (https://...)."
            actionLabel="Try again"
            onAction={() => surveysQuery.refetch()}
          />
        ) : hasSurveys ? (
          <div className={cardStyles.cardGrid}>
            {surveys.map((survey, index) => (
              <SurveyCardMotion key={survey.id} index={index}>
                <SurveyCard survey={survey} mode="public" />
              </SurveyCardMotion>
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
