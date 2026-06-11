import {
  findCertificateForFilename,
  splitAnswerValues
} from "@/lib/responseUtils";
import type { Question, QuestionType } from "@/types/question";
import type { SurveyResponseSummary } from "@/types/survey";

export type AnswerActionKind = "email" | "external_link" | "download";

export type AnswerAction = {
  kind: AnswerActionKind;
  key: string;
  value: string;
  label: string;
  href: string;
  certificateId?: string;
  filename?: string;
};

const EMAIL_KEY_PATTERN = /(^|_)(email|e_mail)(_|$)/i;
const LINK_KEY_PATTERN =
  /portfolio|website|web_site|personal_site|url|link|github|linkedin|gitlab|behance|dribbble|bitbucket/i;

const TEXT_LIKE_TYPES = new Set<QuestionType>(["SHORT_TEXT", "LONG_TEXT", "SYSTEM_DESIGN", "EMAIL"]);

const EMAIL_VALUE_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_VALUE_PATTERN = /^(https?:\/\/|www\.)/i;

export function isEmailValue(value: string): boolean {
  return EMAIL_VALUE_PATTERN.test(value.trim());
}

export function isUrlLikeValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("|")) return false;
  return URL_VALUE_PATTERN.test(trimmed);
}

function looksLikeBareUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("|") || trimmed.includes("@")) return false;
  if (!trimmed.includes(".")) return false;

  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase();
    if (!host.includes(".")) return false;
    // Ignore option-style tokens such as NODE.JS when they slip through without a question type.
    if (/\.(js|ts|tsx|jsx|py|java|go|rb|cs|php|pdf)$/i.test(host)) return false;
    return true;
  } catch {
    return false;
  }
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

function isTextLikeQuestion(questionType?: QuestionType): boolean {
  if (!questionType) return true;
  return TEXT_LIKE_TYPES.has(questionType);
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

  if (
    questionType === "SINGLE_CHOICE" ||
    questionType === "MULTIPLE_CHOICE" ||
    questionType === "NUMBER" ||
    questionType === "FILE_UPLOAD"
  ) {
    return null;
  }

  if (!isTextLikeQuestion(questionType)) {
    return null;
  }

  if (isLinkKey(key) && (isUrlLikeValue(trimmed) || looksLikeBareUrl(trimmed))) {
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
    if (!action) return;
    const dedupeKey =
      action.kind === "download"
        ? `download:${action.certificateId}`
        : `${action.kind}:${action.href}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    actions.push(action);
  };

  if (response.email) {
    push(getAnswerAction("email_address", response.email, questionTypeMap?.get("email_address") ?? "EMAIL"));
  }

  for (const [key, value] of Object.entries(answers)) {
    const questionType = questionTypeMap?.get(key);

    if (questionType === "FILE_UPLOAD") {
      for (const filename of splitAnswerValues(value)) {
        const cert = findCertificateForFilename(filename, response.certificates);
        if (!cert) continue;
        push({
          kind: "download",
          key,
          value: filename,
          label: "Download",
          href: `#certificate-${cert.id}`,
          certificateId: cert.id,
          filename: cert.filename
        });
      }
      continue;
    }

    push(getAnswerAction(key, value, questionType));
  }

  return actions;
}
