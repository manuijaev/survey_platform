"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SurveyEditor } from "@/components/admin/SurveyEditor";
import { SurveySelector } from "@/components/admin/SurveySelector";
import { SurveyCardSkeleton } from "@/components/survey/SurveyCardSkeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSurveyMutations, useSurveys } from "@/lib/hooks";
import type { Survey } from "@/types/survey";

export type AdminWorkspaceSegment = "questions" | "responses";

const segmentCopy: Record<
  AdminWorkspaceSegment,
  { eyebrow: string; title: string; description: string; pickerTitle: string; pickerDescription: string }
> = {
  questions: {
    eyebrow: "Questions",
    title: "Question management",
    description: "Choose which survey you want to edit, then add source questions, targets, and branching rules.",
    pickerTitle: "Select a survey to continue",
    pickerDescription: "Pick a survey from the list below to open its question editor."
  },
  responses: {
    eyebrow: "Responses",
    title: "Response review",
    description: "Choose which survey you want to inspect, then browse submissions and your talent vault.",
    pickerTitle: "Select a survey to continue",
    pickerDescription: "Pick a survey from the list below to open its responses."
  }
};

function workspacePath(segment: AdminWorkspaceSegment, surveyId: string) {
  return `/admin/surveys/${surveyId}/${segment}`;
}

export function AdminSurveyWorkspace({ segment }: { segment: AdminWorkspaceSegment }) {
  const router = useRouter();
  const surveysQuery = useSurveys();
  const { createSurvey } = useSurveyMutations();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState("");

  const copy = segmentCopy[segment];
  const surveys = surveysQuery.data ?? [];

  const openSurvey = (surveyId: string) => {
    router.push(workspacePath(segment, surveyId));
  };

  const saveSurvey = async (values: { name: string; description?: string }) => {
    const created = await createSurvey.mutateAsync(values);
    setEditorOpen(false);
    if (created?.id) {
      router.push(workspacePath("questions", created.id));
    }
  };

  if (surveysQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 h-28 animate-pulse rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SurveyCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <WorkspaceHeader copy={copy} />
        <EmptyState
          title="Create your first survey"
          description="You need at least one survey before you can manage questions or review responses. After creation you will be taken straight to the question editor."
          actionLabel="Create survey"
          onAction={() => setEditorOpen(true)}
          className="mt-8"
        />
        <SurveyEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={saveSurvey}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeader copy={copy} />

      <div className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl text-[color:var(--text-primary)]">{copy.pickerTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
              {copy.pickerDescription}
            </p>
          </div>
          <SurveySelector
            surveys={surveys}
            value={selectedSurveyId}
            onChange={(surveyId) => {
              setSelectedSurveyId(surveyId);
              openSurvey(surveyId);
            }}
            className="w-full lg:w-auto"
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {surveys.map((survey) => (
            <SurveyPickCard key={survey.id} survey={survey} onOpen={() => openSurvey(survey.id)} />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-[color:var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[color:var(--text-secondary)]">
            Need another survey? Create one and jump straight into question setup.
          </p>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditorOpen(true)}>
            Create survey
          </Button>
        </div>
      </div>

      <SurveyEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={saveSurvey}
      />
    </div>
  );
}

function WorkspaceHeader({
  copy
}: {
  copy: (typeof segmentCopy)[AdminWorkspaceSegment];
}) {
  return (
    <div>
      <div className="text-sm uppercase tracking-[0.24em] text-[color:var(--text-muted)]">{copy.eyebrow}</div>
      <h1 className="mt-3 font-display text-3xl text-[color:var(--text-primary)] sm:text-4xl">{copy.title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">{copy.description}</p>
    </div>
  );
}

function SurveyPickCard({ survey, onOpen }: { survey: Survey; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="focus-ring rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-4 py-4 text-left transition hover:border-[color:var(--border-active)] hover:bg-[rgba(13,148,136,0.08)]"
    >
      <div className="font-medium text-[color:var(--text-primary)]">{survey.name}</div>
      {survey.description ? (
        <p className="mt-1 line-clamp-2 text-sm text-[color:var(--text-secondary)]">{survey.description}</p>
      ) : (
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">No description</p>
      )}
      <div className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--primary)]">Open</div>
    </button>
  );
}
