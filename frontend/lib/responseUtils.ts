import { safeXmlText } from "./xml";
import { ensureArray, safeText } from "./utils";
import type { Question, QuestionType } from "@/types/question";
import type { SurveyResponseSummary } from "@/types/survey";

const NAME_KEY_PATTERN = /(^|_)(full_?name|candidate_?name|your_?name|applicant_?name|name)(_|$)/i;
const EMAIL_KEY_PATTERN = /(^|_)(email|e_mail|email_address)(_|$)/i;
const NAME_TEXT_PATTERN = /\b(full\s+name|your\s+name|candidate\s+name|applicant\s+name)\b/i;

export type AnswerDisplayEntry = {
  key: string;
  label: string;
  value: string;
  order: number;
};

const RESPONSE_META_KEYS = new Set(["response_id", "certificates", "date_responded", "shortlisted"]);

/** Parse flat or nested answer XML into a slug -> value map. */
export function parseResponseAnswers(data: Record<string, unknown>): Record<string, string> {
  const answers: Record<string, string> = {};

  const addAnswer = (key: string, value: unknown) => {
    const slug = safeText(key).trim();
    if (!slug || RESPONSE_META_KEYS.has(slug)) return;
    const text = safeXmlText(value).trim();
    if (text) answers[slug] = text;
  };

  const answersWrapper = data.answers;
  if (answersWrapper && typeof answersWrapper === "object") {
    const wrapper = answersWrapper as Record<string, unknown>;
    for (const item of ensureArray(wrapper.answer ?? wrapper)) {
      if (typeof item !== "object" || item === null) continue;
      const row = item as Record<string, unknown>;
      const questionName = safeXmlText(row.question_name ?? row.questionName).trim();
      const answerValue = safeXmlText(row.answer_value ?? row.answerValue ?? row["#text"]).trim();
      if (questionName) addAnswer(questionName, answerValue);
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (RESPONSE_META_KEYS.has(key) || key.startsWith("@_") || key === "answers") continue;
    addAnswer(key, value);
  }

  return answers;
}

export function deriveResponseIdentity(
  answers: Record<string, string>,
  questions?: Question[]
): { fullName: string; email: string } {
  let fullName = "";
  let email = "";

  for (const [key, value] of Object.entries(answers)) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (!email && EMAIL_KEY_PATTERN.test(key)) email = trimmed;
    if (!fullName && NAME_KEY_PATTERN.test(key)) fullName = trimmed;
  }

  if (questions?.length) {
    for (const question of questions) {
      const slug = (question.slug ?? question.id).trim();
      if (!slug) continue;
      const value = answers[slug]?.trim();
      if (!value) continue;

      if (!email && question.type === "EMAIL") {
        email = value;
      }

      if (
        !fullName &&
        (NAME_KEY_PATTERN.test(slug) || NAME_TEXT_PATTERN.test(question.text))
      ) {
        fullName = value;
      }
    }
  }

  return {
    fullName:
      fullName ||
      answers.full_name ||
      answers.fullName ||
      answers.candidate_name ||
      "",
    email: email || answers.email_address || answers.email || ""
  };
}

export function slugToLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildOrderedAnswerEntries(
  answers: Record<string, string>,
  questions?: Question[]
): AnswerDisplayEntry[] {
  const questionBySlug = new Map<string, Question>();
  for (const question of questions ?? []) {
    const slug = (question.slug ?? question.id).trim();
    if (slug) questionBySlug.set(slug, question);
  }

  return Object.entries(answers)
    .map(([key, value], index) => {
      const question = questionBySlug.get(key);
      return {
        key,
        value,
        label: question?.text?.trim() || slugToLabel(key),
        order: question?.order ?? 1000 + index
      };
    })
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));
}

export function isIdentityAnswerKey(key: string): boolean {
  return NAME_KEY_PATTERN.test(key) || EMAIL_KEY_PATTERN.test(key);
}

export function splitAnswerValues(value: string): string[] {
  return value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatAnswerPreview(value: string, questionType?: QuestionType): string {
  if (!value) return "—";
  if (questionType !== "FILE_UPLOAD") return value;

  const files = splitAnswerValues(value);
  if (files.length === 0) return "No files uploaded";
  if (files.length === 1) return files[0];
  return `${files.length} files uploaded`;
}

export function findCertificateForFilename(
  filename: string,
  certificates: SurveyResponseSummary["certificates"]
) {
  const normalized = filename.trim().toLowerCase();
  return certificates.find((cert) => cert.filename.trim().toLowerCase() === normalized);
}

export function collectReferencedCertificateIds(response: SurveyResponseSummary): Set<string> {
  const referenced = new Set<string>();
  const answers = response.answers ?? {};

  for (const [key, value] of Object.entries(answers)) {
    if (!value) continue;
    for (const filename of splitAnswerValues(value)) {
      const cert = findCertificateForFilename(filename, response.certificates);
      if (cert) referenced.add(cert.id);
    }
  }

  return referenced;
}
