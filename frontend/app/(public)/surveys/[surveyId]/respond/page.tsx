"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { QuestionInputForm, type QuestionStepValue } from "@/components/survey/QuestionInputForm";
import { QuestionStep } from "@/components/survey/QuestionStep";
import { ReviewScreen } from "@/components/survey/ReviewScreen";
import { ResponseCard } from "@/components/survey/ResponseCard";
import { useNextQuestion, useQuestions, useSubmitSurveyResponse, useSurvey } from "@/lib/hooks";
import type { NextQuestionResponse } from "@/types/response";
import type { Question, QuestionType } from "@/types/question";

type StepRecord = {
  question: Question;
  answer: string | string[] | number;
  files: File[];
  answerText: string;
};

function normalizeType(type?: string): QuestionType {
  const value = (type ?? "").toUpperCase().trim();
  // Direct enum name match (returned by our fixed toQuestionType)
  if (value === "SHORT_TEXT") return "SHORT_TEXT";
  if (value === "LONG_TEXT") return "LONG_TEXT";
  if (value === "EMAIL") return "EMAIL";
  if (value === "SINGLE_CHOICE") return "SINGLE_CHOICE";
  if (value === "MULTIPLE_CHOICE") return "MULTIPLE_CHOICE";
  if (value === "FILE_UPLOAD") return "FILE_UPLOAD";
  if (value === "NUMBER") return "NUMBER";
  // Fallback fuzzy matching for legacy wire values
  if (value.includes("LONG")) return "LONG_TEXT";
  if (value.includes("EMAIL")) return "EMAIL";
  if (value.includes("MULTI")) return "MULTIPLE_CHOICE";
  if (value.includes("SINGLE")) return "SINGLE_CHOICE";
  if (value.includes("FILE")) return "FILE_UPLOAD";
  if (value.includes("NUMBER")) return "NUMBER";
  return "SHORT_TEXT";
}

function normalizeQuestion(question: NonNullable<NextQuestionResponse["question"]>, surveyId: string): Question {
  const options = Array.isArray(question.options)
    ? question.options.map((option) => ({
        value: option.value,
        label: option.label
      }))
    : [];

  return {
    // question.id is now the slug (e.g. "full_name") set by getNextQuestion from @_name attribute
    id: question.id,
    surveyId,
    slug: question.id, // slug = id = the question name/slug from the backend
    text: question.text,
    description: question.description,
    type: normalizeType(question.type),
    required: question.required,
    options,
    allowMultipleSelections: question.allowMultipleSelections,
    fileFormat: question.fileFormat,
    maxFileSizeMb: question.maxFileSizeMb,
    multipleFiles: question.multipleFiles,
    minNumber: question.minNumber,
    maxNumber: question.maxNumber
  };
}

function serializeAnswer(question: Question, value: QuestionStepValue) {
  if (question.type === "FILE_UPLOAD") {
    return (value.files ?? []).map((file) => file.name).join("|");
  }

  if (Array.isArray(value.answer)) {
    return value.answer.join("|");
  }

  return value.answer ?? "";
}

function createStepRecord(question: Question, value: QuestionStepValue): StepRecord {
  const answer = question.type === "FILE_UPLOAD" ? "" : value.answer ?? "";
  const answerText =
    question.type === "FILE_UPLOAD"
      ? (value.files ?? []).map((file) => file.name).join(", ")
      : Array.isArray(answer)
        ? answer.join(", ")
        : String(answer);

  return {
    question,
    answer: answer as string | string[] | number,
    files: value.files ?? [],
    answerText
  };
}

function buildSubmissionEmail(records: StepRecord[]) {
  const emailRecord = records.find((record) => record.question.type === "EMAIL");
  return emailRecord ? emailRecord.answerText : "";
}

export default function SurveyRespondPage() {
  const params = useParams<{ surveyId: string }>();
  const router = useRouter();
  const surveyId = params.surveyId;

  const surveyQuery = useSurvey(surveyId);
  const metadataQuery = useQuestions(surveyId);
  const nextQuestionMutation = useNextQuestion();
  const submitMutation = useSubmitSurveyResponse();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [records, setRecords] = useState<StepRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, QuestionStepValue>>({});
  const [seenQuestionIds, setSeenQuestionIds] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionEmail, setSubmissionEmail] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [stepError, setStepError] = useState("");
  const [initialResolved, setInitialResolved] = useState(false);
  const [initError, setInitError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const recordsRef = useRef<StepRecord[]>([]);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    if (!surveyId) return;
    setInitialResolved(false);
    setInitError(false);

    let active = true;
    const run = async () => {
      try {
        const result = await nextQuestionMutation.mutateAsync({
          surveyId,
          answeredQuestions: [],
          lastAnswers: {}
        });

        if (!active) return;

        if (result.surveyComplete || !result.question) {
          setReviewMode(true);
          return;
        }

        setCurrentQuestion(normalizeQuestion(result.question, surveyId));
        setInitError(false);
      } catch {
        if (active) setInitError(true);
      } finally {
        if (active) {
          setInitialResolved(true);
          setStepError("");
        }
      }
    };

    void run();
    return () => {
      active = false;
    };
  // retryKey lets the user retry after a network error
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId, retryKey]);

  const totalSteps = useMemo(() => {
    const metadataCount = metadataQuery.data?.length ?? 0;
    return Math.max(metadataCount + 1, records.length + 1, 1);
  }, [metadataQuery.data?.length, records.length]);

  const currentStep = reviewMode ? records.length + 1 : records.length + 1;
  const currentProgress = Math.min(currentStep, totalSteps);
  const activeQuestion = currentQuestion;
  const currentDraft = activeQuestion ? drafts[activeQuestion.id] : undefined;

  const goPrevious = () => {
    const snapshot = recordsRef.current;
    if (snapshot.length === 0) return;

    const previousRecord = snapshot[snapshot.length - 1];
    setRecords(snapshot.slice(0, -1));
    setCurrentQuestion(previousRecord.question);
    setReviewMode(false);
    setStepError("");
  };

  const goToReviewStep = (index: number) => {
    const snapshot = recordsRef.current;
    const target = snapshot[index];
    if (!target) return;

    setRecords(snapshot.slice(0, index));
    setCurrentQuestion(target.question);
    setReviewMode(false);
    setStepError("");
  };

  const submitStep = async (value: Required<QuestionStepValue>) => {
    if (!activeQuestion || !surveyId) return;

    setIsAdvancing(true);
    setStepError("");

    const nextRecord = createStepRecord(activeQuestion, value);
    const nextRecords = [...recordsRef.current, nextRecord];
    // Backend resolveNextQuestion matches by question name/slug, not numeric id
    const questionSlug = activeQuestion.slug ?? activeQuestion.id;

    // Accumulate ALL answers so multi-hop branching rules work correctly
    const allAnswers: Record<string, string | number> = {};
    for (const record of nextRecords) {
      const slug = record.question.slug ?? record.question.id;
      allAnswers[slug] = serializeAnswer(record.question, {
        answer: record.answer,
        files: record.files
      });
    }

    setDrafts((current) => ({
      ...current,
      [activeQuestion.id]: value
    }));

    if (activeQuestion.type === "EMAIL") {
      setSubmissionEmail(nextRecord.answerText);
    }

    try {
      const result = await nextQuestionMutation.mutateAsync({
        surveyId,
        answeredQuestions: nextRecords.map((record) => record.question.slug ?? record.question.id),
        lastAnswers: allAnswers
      });

      setRecords(nextRecords);

      if (result.surveyComplete || !result.question) {
        setReviewMode(true);
        setCurrentQuestion(null);
        return;
      }

      setCurrentQuestion(normalizeQuestion(result.question, surveyId));
      setReviewMode(false);
    } finally {
      setIsAdvancing(false);
    }
  };

  const submitSurvey = async () => {
    const submissionRecords = recordsRef.current;
    const email = buildSubmissionEmail(submissionRecords);
    const answers = submissionRecords.map((record) => {
      const questionId = (record.question.slug ?? record.question.id).trim();
      return {
        // Use slug as questionId — backend maps by question name (slug)
        questionId,
        value:
          record.question.type === "FILE_UPLOAD"
            ? record.files.map((file) => file.name)
            : record.answer
      };
    });

    const files = submissionRecords.flatMap((record) => record.files);

    setSubmissionEmail(email);
    await submitMutation.mutateAsync({
      surveyId,
      email,
      answers,
      files
    });

    setSubmitted(true);
  };

  const loadingInitial = surveyQuery.isLoading || (!initialResolved && !currentQuestion && !reviewMode && !submitted);
  const surveyTitle = surveyQuery.data?.name ?? "Survey response";

  if (surveyQuery.isError && !surveyQuery.data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="Survey unavailable"
          description="The survey could not be loaded from the backend."
          actionLabel="Back to surveys"
          onAction={() => router.push("/surveys")}
        />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[680px] items-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.34, ease: "easeOut" }}
          className="w-full rounded-[2rem] border border-[color:var(--border)] bg-[rgba(12,20,16,0.92)] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8"
        >
          <motion.svg viewBox="0 0 120 120" className="mx-auto h-24 w-24 text-[color:var(--accent)]">
            <motion.circle
              cx="60"
              cy="60"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="276"
              strokeDashoffset="276"
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <motion.path
              d="M38 61.5 53 76 83 45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="80"
              strokeDashoffset="80"
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            />
          </motion.svg>
          <h1 className="mt-5 font-display text-4xl text-[color:var(--text-primary)]">Response Submitted</h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
            {submissionEmail
              ? `Your response from ${submissionEmail} has been recorded.`
              : "Your response has been recorded and sent to the backend."}
          </p>
          <Button className="mt-8 min-w-48" onClick={() => router.push("/surveys")}>
            Return to Surveys
          </Button>
        </motion.div>
      </div>
    );
  }

  if (loadingInitial) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[680px] flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-36 rounded-full" />
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-[2rem]" />
      </div>
    );
  }

  if (!activeQuestion && reviewMode && records.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[680px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <ResponseCard
          title="Survey complete"
          message="This survey has no questions to display."
          actionLabel="Return to surveys"
          onAction={() => router.push("/surveys")}
          className="w-full"
        />
      </div>
    );
  }

  if (initialResolved && !activeQuestion && !reviewMode && !submitted) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[680px] items-center px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title={initError ? "Cannot reach server" : surveyQuery.data ? "Survey flow unavailable" : "Survey not found"}
          description={
            initError
              ? "The backend server is not responding. Make sure it is running on port 8080, then retry."
              : surveyQuery.data
                ? "The first question could not be loaded from the backend."
                : "The requested survey could not be found."
          }
          actionLabel={initError ? "Retry" : "Reload"}
          onAction={() => {
            if (initError) {
              setRetryKey((k) => k + 1);
            } else {
              window.location.reload();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[680px]">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <button
            type="button"
            onClick={() => router.push(`/surveys/${surveyId}`)}
            className="focus-ring inline-flex min-h-11 items-center gap-2 self-start text-sm text-[color:var(--text-secondary)] transition hover:text-[color:var(--text-primary)]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="min-w-0 sm:text-right">
            <div className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Survey flow</div>
            <h1 className="survey-name survey-name--md mt-1 truncate sm:text-4xl">
              {surveyTitle}
            </h1>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-[color:var(--border)] bg-[rgba(12,20,16,0.8)] px-4 py-4 backdrop-blur-xl md:mb-6">
          <Progress value={currentProgress} total={totalSteps} label={`Step ${currentProgress} of ${totalSteps}`} />
        </div>

        <AnimatePresence mode="wait">
          {reviewMode ? (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
            >
              <ReviewScreen
                items={records.map((record) => ({
                  questionId: record.question.id,
                  questionText: record.question.text,
                  answerText: record.answerText,
                  files: record.files
                }))}
                onEdit={goToReviewStep}
                onSubmit={submitSurvey}
                submitting={submitMutation.isPending}
              />
            </motion.div>
          ) : currentQuestion ? (
            <QuestionStep
              key={currentQuestion.id}
              question={currentQuestion}
              index={records.length}
              total={totalSteps}
              seen={seenQuestionIds.includes(currentQuestion.id)}
              formId={`question-form-${currentQuestion.id}`}
              onTypewriterDone={() => {
                setSeenQuestionIds((current) => (current.includes(currentQuestion.id) ? current : [...current, currentQuestion.id]));
              }}
              onPrevious={goPrevious}
              submitting={isAdvancing}
              canGoBack={records.length > 0}
              error={stepError}
            >
              <QuestionInputForm
                key={currentQuestion.id}
                formId={`question-form-${currentQuestion.id}`}
                question={currentQuestion}
                defaultValue={currentDraft}
                onValidSubmit={submitStep}
                onInvalidSubmit={(message) => {
                  setStepError(message);
                }}
              />
            </QuestionStep>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
