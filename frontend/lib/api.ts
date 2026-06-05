import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";
import { parseXML, buildXML, isXmlString } from "./xml";
import { toastService } from "./toast-service";
import {
  ensureArray,
  formatBytes,
  normalizeArray,
  safeText,
  toBoolean,
  toNumber,
  slugify
} from "./utils";
import type { Survey, SurveyPayload, SurveyResponseSummary } from "@/types/survey";
import type { Question, QuestionOption, QuestionPayload, QuestionType } from "@/types/question";
import type { NextQuestionResponse, SurveySubmissionPayload } from "@/types/response";
import type { SurveyRulePayload } from "@/types/rule";

const BASE_URL = "http://localhost:8080";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/xml",
    "Content-Type": "application/xml"
  },
  responseType: "text",
  transformResponse: [(data) => data]
});

const parsePayload = <T>(value: unknown): T => {
  if (typeof value === "string" && isXmlString(value)) {
    return parseXML<T>(value);
  }

  return value as T;
};

const getErrorMessage = (error: AxiosError) => {
  const data = error.response?.data;
  if (typeof data === "string" && isXmlString(data)) {
    const parsed = parseXML<Record<string, unknown>>(data);
    return (
      safeText(parsed.message) ||
      safeText(parsed.error) ||
      safeText(parsed.detail) ||
      safeText(parsed.reason)
    );
  }

  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;
    return (
      safeText(payload.message) ||
      safeText(payload.error) ||
      safeText(payload.detail) ||
      safeText(payload.reason)
    );
  }

  return "";
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const message = getErrorMessage(error);

    if (status === 404) {
      toastService.error("Not found", "The requested resource does not exist.");
    }

    if (status === 400) {
      toastService.error("Invalid request", message || "Check your input and try again.");
    }

    if (status === 500) {
      toastService.error("Server error", "An unexpected server error occurred.");
    }

    if (!error.response) {
      toastService.error("No connection", "Could not reach the server. Check your network.");
    }

    return Promise.reject(error);
  }
);

const requestXml = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await api.request<string>({
    ...config,
    responseType: "text",
    transformResponse: [(data) => data]
  });
  return parsePayload<T>(response.data);
};

const toSurvey = (payload: Record<string, unknown>): Survey => {
  const survey = payload.survey ?? payload;
  const data = survey as Record<string, unknown>;
  return {
    id: safeText(data.id || data.surveyId || data["@_id"]),
    name: safeText(data.name || data.title),
    description: safeText(data.description),
    responseCount: toNumber(data.responseCount ?? data.responses ?? 0),
    lastUpdated: safeText(data.lastUpdated || data.updatedAt || data.modifiedAt) || undefined,
    active: toBoolean(data.active ?? true)
  };
};

const toSurveys = (payload: unknown): Survey[] => {
  const root = parsePayload<Record<string, unknown>>(payload);
  const surveys =
    root.surveys ||
    root.surveyList ||
    root.items ||
    root.data ||
    root.survey ||
    root;

  return ensureArray(surveys as Survey[] | Survey | Record<string, unknown>).map((item) =>
    toSurvey(item as Record<string, unknown>)
  );
};

const toQuestionType = (value: unknown): QuestionType => {
  const text = safeText(value).toUpperCase();
  if (text.includes("LONG")) return "LONG_TEXT";
  if (text.includes("EMAIL")) return "EMAIL";
  if (text.includes("MULTI")) return "MULTIPLE_CHOICE";
  if (text.includes("SINGLE") || text.includes("RADIO")) return "SINGLE_CHOICE";
  if (text.includes("FILE") || text.includes("UPLOAD")) return "FILE_UPLOAD";
  return "SHORT_TEXT";
};

const toOption = (value: unknown): QuestionOption => {
  if (typeof value === "string") {
    return { value, label: value };
  }
  const data = value as Record<string, unknown>;
  return {
    id: safeText(data.id || data.optionId) || undefined,
    value: safeText(data.value || data.name || data.code || data.label),
    label: safeText(data.label || data.displayLabel || data.value || data.name)
  };
};

const toQuestion = (payload: Record<string, unknown>): Question => {
  const question = payload.question ?? payload;
  const data = question as Record<string, unknown>;
  const optionsSource = data.options || data.option || data.choices || [];
  return {
    id: safeText(data.id || data.questionId || data["@_id"] || slugify(safeText(data.text))),
    surveyId: safeText(data.surveyId || data.parentSurveyId),
    slug: safeText(data.name || data.slug) || undefined,
    text: safeText(data.text || data.questionText || data.label),
    description: safeText(data.description) || undefined,
    type: toQuestionType(data.type || data.questionType),
    required: toBoolean(data.required),
    order: toNumber(data.order || data.position, 0),
    options: ensureArray(optionsSource).map(toOption),
    allowMultipleSelections: toBoolean(data.allowMultipleSelections || data.multiple),
    fileFormat: safeText(data.fileFormat) || undefined,
    maxFileSizeMb: data.maxFileSizeMb !== undefined ? toNumber(data.maxFileSizeMb, 1) : undefined,
    multipleFiles: toBoolean(data.multipleFiles)
  };
};

const toQuestions = (payload: unknown): Question[] => {
  const root = parsePayload<Record<string, unknown>>(payload);
  const questions = root.questions || root.questionList || root.items || root.data || root.question || root;
  return ensureArray(questions as Question[] | Question | Record<string, unknown>).map((item) =>
    toQuestion(item as Record<string, unknown>)
  );
};

const toResponses = (payload: unknown): SurveyResponseSummary[] => {
  const root = parsePayload<Record<string, unknown>>(payload);
  const responses = root.responses || root.responseList || root.items || root.data || root.response || root;
  return ensureArray(responses as SurveyResponseSummary[] | SurveyResponseSummary | Record<string, unknown>).map(
    (item) => {
      const data = (item as Record<string, unknown>).response ? (item as Record<string, unknown>).response : item;
      const response = data as Record<string, unknown>;
      return {
        id: safeText(response.id || response.responseId),
        surveyId: safeText(response.surveyId),
        fullName: safeText(response.fullName || response.name),
        email: safeText(response.email),
        gender: safeText(response.gender) || undefined,
        programmingStack: normalizeArray(response.programmingStack || response.stack || response.technologies).map(
          (stack) => safeText(stack)
        ),
        certificates: normalizeArray(response.certificates || response.certificate).map((cert) => {
          const certData = cert as Record<string, unknown>;
          return {
            id: safeText(certData.id || certData.certificateId),
            filename: safeText(certData.filename || certData.name || certData.fileName)
          };
        }),
        respondedAt: safeText(response.respondedAt || response.submittedAt || response.createdAt)
      };
    }
  );
};

export const surveyApi = {
  getSurveys: async () => toSurveys(await requestXml<unknown>({ url: "/api/surveys", method: "GET" })),
  createSurvey: async (payload: SurveyPayload) =>
    requestXml<unknown>({
      url: "/api/surveys",
      method: "POST",
      data: buildXML({
        survey: {
          name: payload.name,
          description: payload.description ?? ""
        }
      })
    }),
  updateSurvey: async (id: string, payload: SurveyPayload) =>
    requestXml<unknown>({
      url: `/api/surveys/${id}`,
      method: "PUT",
      data: buildXML({
        survey: {
          id,
          name: payload.name,
          description: payload.description ?? ""
        }
      })
    }),
  deleteSurvey: async (id: string) =>
    requestXml<unknown>({
      url: `/api/surveys/${id}`,
      method: "DELETE"
    }),
  getQuestions: async (surveyId: string) =>
    toQuestions(await requestXml<unknown>({ url: `/api/surveys/${surveyId}/questions`, method: "GET" })),
  createQuestion: async (surveyId: string, payload: QuestionPayload) =>
    requestXml<unknown>({
      url: `/api/surveys/${surveyId}/questions`,
      method: "POST",
      data: buildXML({
        question: {
          name: payload.name,
          text: payload.text,
          description: payload.description ?? "",
          type: payload.type,
          required: payload.required,
          allowMultipleSelections: payload.allowMultipleSelections ?? false,
          fileFormat: payload.fileFormat ?? "",
          maxFileSizeMb: payload.maxFileSizeMb ?? "",
          multipleFiles: payload.multipleFiles ?? false,
          options: {
            option: payload.options.map((option) => ({
              value: option.value,
              label: option.label
            }))
          }
        }
      })
    }),
  updateQuestion: async (surveyId: string, questionId: string, payload: QuestionPayload) =>
    requestXml<unknown>({
      url: `/api/surveys/${surveyId}/questions/${questionId}`,
      method: "PUT",
      data: buildXML({
        question: {
          id: questionId,
          name: payload.name,
          text: payload.text,
          description: payload.description ?? "",
          type: payload.type,
          required: payload.required,
          allowMultipleSelections: payload.allowMultipleSelections ?? false,
          fileFormat: payload.fileFormat ?? "",
          maxFileSizeMb: payload.maxFileSizeMb ?? "",
          multipleFiles: payload.multipleFiles ?? false,
          options: {
            option: payload.options.map((option) => ({
              value: option.value,
              label: option.label
            }))
          }
        }
      })
    }),
  deleteQuestion: async (surveyId: string, questionId: string) =>
    requestXml<unknown>({
      url: `/api/surveys/${surveyId}/questions/${questionId}`,
      method: "DELETE"
    }),
  reorderQuestions: async (surveyId: string, questionIds: string[]) =>
    requestXml<unknown>({
      url: `/api/surveys/${surveyId}/questions/order`,
      method: "PATCH",
      data: buildXML({
        order: {
          questionIds: {
            questionId: questionIds
          }
        }
      })
    }),
  getResponses: async (
    surveyId: string,
    params?: { email?: string; page?: number; size?: number }
  ) =>
    toResponses(
      await requestXml<unknown>({
        url: `/api/surveys/${surveyId}/responses`,
        method: "GET",
        params
      })
    ),
  downloadCertificate: async (certificateId: string) =>
    api.get(`/api/certificates/${certificateId}`, {
      responseType: "blob",
      headers: { Accept: "application/pdf" }
    }),
  getNextQuestion: async (
    surveyId: string,
    answeredQuestions: string[],
    lastAnswers: Record<string, string>
  ): Promise<NextQuestionResponse> => {
    const response = await requestXml<unknown>({
      url: `/api/surveys/${surveyId}/next-question`,
      method: "GET",
      params: {
        answeredQuestions: answeredQuestions.join(","),
        lastAnswers: JSON.stringify(lastAnswers)
      }
    });
    const root = parsePayload<Record<string, unknown>>(response);
    return {
      surveyComplete: toBoolean(root.survey_complete ?? root.surveyComplete ?? root.complete),
      question: root.question
        ? (() => {
            const question = root.question as Record<string, unknown>;
            return {
              id: safeText(question.id || question.questionId),
              text: safeText(question.text || question.questionText),
              description: safeText(question.description) || undefined,
              type: safeText(question.type || question.questionType),
              required: toBoolean(question.required),
              options: ensureArray(question.options || question.option || []).map((option) => {
                const data = option as Record<string, unknown>;
                return {
                  value: safeText(data.value || data.name || data.label),
                  label: safeText(data.label || data.displayLabel || data.value || data.name)
                };
              }),
              allowMultipleSelections: toBoolean(question.allowMultipleSelections),
              fileFormat: safeText(question.fileFormat) || undefined,
              maxFileSizeMb: question.maxFileSizeMb ? toNumber(question.maxFileSizeMb, 1) : undefined,
              multipleFiles: toBoolean(question.multipleFiles)
            };
          })()
        : undefined
    };
  },
  submitSurveyResponse: async ({ surveyId, email, answers, files }: SurveySubmissionPayload) => {
    const xmlPayload = buildXML({
      question_response: {
        surveyId,
        email: email ?? "",
        answers: {
          answer: answers.map((answer) => ({
            questionId: answer.questionId,
            value: Array.isArray(answer.value) ? answer.value.join("|") : answer.value ?? ""
          }))
        }
      }
    });

    const formData = new FormData();
    formData.append("xmlPayload", new Blob([xmlPayload], { type: "application/xml" }), "response.xml");
    files.forEach((file) => formData.append("certificates[]", file));

    return api.post(`/api/surveys/${surveyId}/responses`, formData, {
      headers: { "Content-Type": "multipart/form-data", Accept: "application/xml" },
      responseType: "text",
      transformResponse: [(data) => data]
    });
  },
  saveRules: async (surveyId: string, rules: SurveyRulePayload[]) =>
    requestXml<unknown>({
      url: `/api/surveys/${surveyId}/rules`,
      method: "POST",
      data: buildXML({
        rules: {
          rule: rules.map((rule) => ({
            sourceQuestionId: rule.sourceQuestionId,
            sourceAnswer: rule.sourceAnswer,
            targetQuestionId: rule.targetQuestionId,
            comparator: rule.comparator ?? "equals"
          }))
        }
      })
    })
};

export { api };
