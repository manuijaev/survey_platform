"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";
import { SurveyEditor } from "@/components/admin/SurveyEditor";
import { SurveyCard } from "@/components/survey/SurveyCard";
import cardStyles from "@/components/survey/SurveyCard.module.css";
import { SurveyCardMotion } from "@/components/survey/SurveyCardMotion";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SurveyCardSkeleton } from "@/components/survey/SurveyCardSkeleton";
import { useSurveyMutations, useSurveys } from "@/lib/hooks";
import type { Survey } from "@/types/survey";

export default function AdminSurveysPage() {
  const router = useRouter();
  const surveysQuery = useSurveys();
  const { createSurvey, updateSurvey, deleteSurvey } = useSurveyMutations();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Survey | null>(null);

  const surveys = surveysQuery.data ?? [];

  const openCreate = () => {
    setEditingSurvey(null);
    setEditorOpen(true);
  };

  const openEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setEditorOpen(true);
  };

  const saveSurvey = async (values: { name: string; description?: string }) => {
    if (editingSurvey) {
      await updateSurvey.mutateAsync({ id: editingSurvey.id, payload: values });
    } else {
      await createSurvey.mutateAsync(values);
    }

    setEditorOpen(false);
    setEditingSurvey(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteSurvey.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Surveys / Management</div>
          <h1 className="mt-3 font-display text-4xl text-[color:var(--text-primary)] sm:text-5xl">
            Survey Management
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
            Create surveys, adjust metadata, and route into questions or responses from one place.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Create Survey
        </Button>
      </div>

      {surveysQuery.isLoading ? (
        <div className={cardStyles.cardGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SurveyCardSkeleton key={index} />
          ))}
        </div>
      ) : surveys.length > 0 ? (
        <div className={cardStyles.cardGrid}>
          {surveys.map((survey, index) => (
            <SurveyCardMotion key={survey.id} index={index}>
              <SurveyCard
                survey={survey}
                mode="admin"
                onEdit={openEdit}
                onManageQuestions={(item) => router.push(`/admin/surveys/${item.id}/questions`)}
                onViewResponses={(item) => router.push(`/admin/surveys/${item.id}/responses`)}
                onDelete={(item) => setPendingDelete(item)}
              />
            </SurveyCardMotion>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing here yet"
          description="Create your first survey to start mapping questions and responses."
          actionLabel="Create survey"
          onAction={openCreate}
        />
      )}

      <SurveyEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingSurvey(null);
        }}
        initialSurvey={editingSurvey}
        onSave={saveSurvey}
      />

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Remove this survey?"
        description="This action is permanent and will delete the survey from the backend."
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} loading={deleteSurvey.isPending}>
              Remove
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl border border-[rgba(13,148,136,0.24)] bg-[rgba(13,148,136,0.08)] p-4 font-mono text-sm text-[color:var(--text-primary)]">
          {pendingDelete?.name}
        </div>
      </Modal>
    </div>
  );
}
