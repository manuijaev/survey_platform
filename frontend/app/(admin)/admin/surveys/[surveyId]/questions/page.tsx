"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BranchingRulesPanel } from "@/components/questions/BranchingRulesPanel";
import { SourceQuestionsPanel } from "@/components/questions/SourceQuestionsPanel";
import { TargetQuestionsPanel } from "@/components/questions/TargetQuestionsPanel";
import {
  QuestionManagementSidebar,
  type QuestionManagementSection,
  type QuestionTab
} from "@/components/questions/QuestionManagementSidebar";
import { useSurvey, useSurveys } from "@/lib/hooks";

export default function QuestionManagementPage() {
  const params = useParams<{ surveyId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyId = params.surveyId;
  const surveyQuery = useSurvey(surveyId);
  const surveysQuery = useSurveys();

  const tabParam = searchParams.get("tab");
  const [activeSection, setActiveSection] = useState<QuestionManagementSection>(() =>
    tabParam === "branching" ? "branching" : "questions"
  );
  const [questionTab, setQuestionTab] = useState<QuestionTab>(() => {
    if (tabParam === "target") return "target";
    if (tabParam === "source" || tabParam === "survey") return "source";
    return "source";
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "target" || tab === "source" || tab === "survey") {
      setActiveSection("questions");
      setQuestionTab(tab === "survey" ? "source" : (tab as QuestionTab));
    } else if (tab === "branching") {
      setActiveSection("branching");
    }
  }, [searchParams]);

  const handleQuestionTabChange = (tab: QuestionTab) => {
    setQuestionTab(tab);
    router.replace(`/admin/surveys/${surveyId}/questions?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
          <Link href="/admin/surveys" className="transition hover:text-[color:var(--text-primary)]">
            Surveys
          </Link>
          <span className="mx-2 text-[color:var(--text-muted)]">/</span>
          <Link
            href={`/surveys/${surveyId}`}
            className="survey-name survey-name--sm transition hover:text-[color:var(--primary)]"
          >
            {surveyQuery.data?.name ?? surveyId}
          </Link>
          <span className="mx-2 text-[color:var(--text-muted)]">/</span>
          <span>Questions</span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Question management</p>
            <h1 className="survey-name survey-name--lg mt-3">{surveyQuery.data?.name ?? "Survey"}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[color:var(--text-secondary)]">
              Manage all survey questions, create custom branching targets, and configure adaptive paths.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="text-sm text-[color:var(--text-secondary)]" htmlFor="survey-selector">
              Survey
            </label>
            <select
              id="survey-selector"
              className="focus-ring h-11 min-w-[220px] rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 text-sm text-[color:var(--text-primary)]"
              value={surveyId}
              onChange={(event) => router.push(`/admin/surveys/${event.target.value}/questions?tab=${questionTab}`)}
            >
              {(surveysQuery.data ?? []).map((survey) => (
                <option key={survey.id} value={survey.id}>
                  {survey.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <QuestionManagementSidebar
          activeSection={activeSection}
          questionTab={questionTab}
          onSectionChange={setActiveSection}
          onQuestionTabChange={handleQuestionTabChange}
        />

        <div className="min-w-0">
          {activeSection === "branching" ? (
            <BranchingRulesPanel surveyId={surveyId} surveyName={surveyQuery.data?.name} />
          ) : questionTab === "target" ? (
            <TargetQuestionsPanel
              surveyId={surveyId}
              surveyName={surveyQuery.data?.name}
              surveys={surveysQuery.data ?? []}
              onSurveyChange={(nextSurveyId) =>
                router.push(`/admin/surveys/${nextSurveyId}/questions?tab=target`)
              }
            />
          ) : (
            <SourceQuestionsPanel
              surveyId={surveyId}
              surveyName={surveyQuery.data?.name}
              surveys={surveysQuery.data ?? []}
              onSurveyChange={(nextSurveyId) =>
                router.push(`/admin/surveys/${nextSurveyId}/questions?tab=source`)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
