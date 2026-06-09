import type { Question, QuestionType } from "@/types/question";
import type { SurveyResponseSummary } from "@/types/survey";

export type AnswerActionKind = "email" | "external_link";

export type AnswerAction = {
  kind: AnswerActionKind;
  key: string;
  value: string;
  label: string;
  href: string;
};

const EMAIL_KEY_PATTERN = /(^|_)(email|e_mail)(_|$)/i;
const LINK_KEY_PATTERN =
  /portfolio|website|web_site|personal_site|url|link|github|linkedin|gitlab|behance|dribbble|bitbucket/i;

const EMAIL_VALUE_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_VALUE_PATTERN = /^(https?:\/\/|www\.)/i;

export function isEmailValue(value: string): boolean {
  return EMAIL_VALUE_PATTERN.test(value.trim());
}

export function isUrlLikeValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("|")) return false;
  return URL_VALUE_PATTERN.test(trimmed) || /^[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/.test(trimmed);
}

export function normalizeExternalUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return `https://${trimmed}`;
}

function isEmailKey(key: string): boolean {
  return EMAIL_KEY_PATTERN.test(key);
}

function isLinkKey(key: string): boolean {
  return LINK_KEY_PATTERN.test(key);
}

function externalLinkLabel(key: string): string {
  const normalized = key.toLowerCase();
  if (normalized.includes("portfolio")) return "Visit portfolio";
  if (normalized.includes("github")) return "Visit GitHub";
  if (normalized.includes("linkedin")) return "Visit LinkedIn";
  if (normalized.includes("gitlab")) return "Visit GitLab";
  if (normalized.includes("behance")) return "Visit Behance";
  if (normalized.includes("dribbble")) return "Visit Dribbble";
  if (normalized.includes("website") || normalized.includes("web_site") || normalized.includes("personal_site")) {
    return "Visit website";
  }
  return "Open link";
}

export function buildQuestionTypeMap(questions: Question[]): Map<string, QuestionType> {
  const map = new Map<string, QuestionType>();
  for (const question of questions) {
    const slug = question.slug ?? question.id;
    map.set(slug, question.type);
  }
  return map;
}

export function getAnswerAction(
  key: string,
  value: string,
  questionType?: QuestionType
): AnswerAction | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (questionType === "EMAIL" || (isEmailKey(key) && isEmailValue(trimmed))) {
    return {
      kind: "email",
      key,
      value: trimmed,
      label: "Send email",
      href: `mailto:${trimmed}`
    };
  }

  if (isLinkKey(key) && (isUrlLikeValue(trimmed) || trimmed.includes("."))) {
    return {
      kind: "external_link",
      key,
      value: trimmed,
      label: externalLinkLabel(key),
      href: normalizeExternalUrl(trimmed)
    };
  }

  if (isUrlLikeValue(trimmed)) {
    return {
      kind: "external_link",
      key,
      value: trimmed,
      label: externalLinkLabel(key),
      href: normalizeExternalUrl(trimmed)
    };
  }

  return null;
}

export function collectResponseActions(
  response: SurveyResponseSummary,
  questionTypeMap?: Map<string, QuestionType>
): AnswerAction[] {
  const actions: AnswerAction[] = [];
  const seen = new Set<string>();
  const answers = response.answers ?? {};

  const push = (action: AnswerAction | null) => {
    if (!action || seen.has(action.href)) return;
    seen.add(action.href);
    actions.push(action);
  };

  if (response.email) {
    push(getAnswerAction("email_address", response.email, questionTypeMap?.get("email_address") ?? "EMAIL"));
  }

  for (const [key, value] of Object.entries(answers)) {
    push(getAnswerAction(key, value, questionTypeMap?.get(key)));
  }

  return actions;
}
