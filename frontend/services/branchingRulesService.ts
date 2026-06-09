import { AxiosError } from "axios";
import { surveyApi } from "@/lib/api";
import type { Question } from "@/types/question";
import type { BranchingRule, BranchingRuleFormFields, BranchingRuleQuestion } from "@/types/rule";

function toBranchingQuestion(question: Question): BranchingRuleQuestion {
  return {
    name: question.slug ?? question.id,
    questionText: question.text,
    type: question.type,
    options: question.options.map((option) => ({
      value: option.value,
      label: option.label
    }))
  };
}

export function getTriggerChoices(sourceQuestion?: BranchingRuleQuestion): BranchingRuleQuestionOption[] {
  if (!sourceQuestion?.options?.length) return [];
  const isChoice =
    sourceQuestion.type === "SINGLE_CHOICE" || sourceQuestion.type === "MULTIPLE_CHOICE";
  if (!isChoice) return [];
  return sourceQuestion.options;
}

function toBranchingRule(rule: {
  id?: string;
  sourceQuestionName: string;
  sourceAnswer: string;
  targetQuestionName: string;
}): BranchingRule {
  return {
    id: rule.id ?? "",
    sourceQuestionName: rule.sourceQuestionName,
    triggerValue: rule.sourceAnswer,
    targetQuestionName: rule.targetQuestionName
  };
}

function toRulePayload(fields: BranchingRuleFormFields) {
  return {
    sourceQuestionName: fields.sourceQuestionName,
    sourceAnswer: fields.triggerValue.trim(),
    targetQuestionName: fields.targetQuestionName
  };
}

export function formatApiError(error: unknown): string {
  if (!navigator.onLine) {
    return "No connection. Check your internet and try again.";
  }

  if (error instanceof AxiosError) {
    if (!error.response) {
      return "No connection. Check your internet and try again.";
    }

    const data = error.response.data;
    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const payload = data as Record<string, unknown>;
      const message =
        (typeof payload.message === "string" && payload.message) ||
        (typeof payload.error === "string" && payload.error) ||
        (typeof payload.detail === "string" && payload.detail);
      if (message) return message;
    }

    return error.message || "Request failed. Please try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Request failed. Please try again.";
}

export async function fetchRules(surveyId: string | number): Promise<BranchingRule[]> {
  const rules = await surveyApi.getRules(String(surveyId));
  return rules
    .filter((rule) => rule.id)
    .map((rule) => toBranchingRule(rule));
}

export async function fetchSurveyQuestions(surveyId: string | number): Promise<BranchingRuleQuestion[]> {
  const questions = await surveyApi.getQuestions(String(surveyId), "survey");
  return questions.map(toBranchingQuestion);
}

export async function fetchBranchQuestions(surveyId: string | number): Promise<BranchingRuleQuestion[]> {
  const questions = await surveyApi.getQuestions(String(surveyId), "branch");
  return questions.map(toBranchingQuestion);
}

export async function createRule(
  surveyId: string | number,
  fields: BranchingRuleFormFields
): Promise<BranchingRule> {
  const created = await surveyApi.createRule(String(surveyId), toRulePayload(fields));
  if (!created.id) {
    throw new Error("Server did not return a rule id.");
  }
  return toBranchingRule(created);
}

export async function updateRule(
  surveyId: string | number,
  ruleId: string,
  fields: BranchingRuleFormFields
): Promise<BranchingRule> {
  const updated = await surveyApi.updateRule(String(surveyId), ruleId, toRulePayload(fields));
  if (!updated.id) {
    throw new Error("Server did not return a rule id.");
  }
  return toBranchingRule(updated);
}

export async function deleteRule(surveyId: string | number, ruleId: string): Promise<void> {
  await surveyApi.deleteRule(String(surveyId), ruleId);
}

export function formatQuestionOptionLabel(question: BranchingRuleQuestion, maxLength = 50): string {
  const label = `${question.name} — ${question.questionText}`;
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

export function validateRuleFields(fields: BranchingRuleFormFields): string | null {
  if (!fields.sourceQuestionName.trim()) return "Source question is required.";
  if (!fields.triggerValue.trim()) return "Trigger value is required.";
  if (!fields.targetQuestionName.trim()) return "Target question is required.";
  return null;
}
