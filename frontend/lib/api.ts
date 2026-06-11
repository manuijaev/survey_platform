import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";
import { parseXML, buildXML, isXmlString } from "./xml";
import { deriveResponseIdentity, parseResponseAnswers } from "./responseUtils";
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
import type { ShortlistStatus, Survey, SurveyPayload, SurveyResponseSummary } from "@/types/survey";
import type { Question, QuestionOption, QuestionPayload, QuestionType } from "@/types/question";
import type { NextQuestionResponse, SurveySubmissionPayload } from "@/types/response";
import type { SurveyRulePayload, SurveyRule } from "@/types/rule";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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
      // Only toast if it's not a survey flow request — the respond page handles its own error UI
      const url = error.config?.url ?? "";
      if (!url.includes("next-question")) {
        toastService.error("No connection", "Could not reach the server. Check your network.");
      }
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
    // id is an XML attribute on the backend, parsed as @_id by fast-xml-parser
    id: safeText(data["@_id"] || data.id || data.surveyId),
    name: safeText(data.name || data.title),
    description: safeText(data.description),
    responseCount: toNumber(data.response_count ?? data.responseCount ?? data.responses ?? 0),
    lastUpdated:
      safeText(data.updated_at || data.lastUpdated || data.updatedAt || data.modifiedAt) || undefined,
    active: toBoolean(data.active ?? true)
  };
};

const toSurveys = (payload: unknown): Survey[] => {
  const root = parsePayload<Record<string, unknown>>(payload);
  // Backend returns <surveys><survey id="...">...</survey></surveys>
  // root = { surveys: { survey: [...] } }
  const surveysRoot = root.surveys as Record<string, unknown> | undefined;
  const surveys =
    surveysRoot?.survey ??
    root.surveys ??
    root.surveyList ??
    root.items ??
    root.data ??
    root.survey ??
    root;

  return ensureArray(surveys as Survey[] | Survey | Record<string, unknown>).map((item) =>
    toSurvey(item as Record<string, unknown>)
  );
};

const toQuestionType = (value: unknown, multiple?: unknown): QuestionType => {
  const text = safeText(value).toUpperCase();
  if (text === "SYSTEM_DESIGN" || text.includes("SYSTEM_DESIGN")) return "SYSTEM_DESIGN";
  if (text.includes("LONG") || text === "LONG_TEXT") return "LONG_TEXT";
  if (text.includes("EMAIL")) return "EMAIL";
  if (text === "CHOICE" || text.includes("CHOICE")) {
    return toBoolean(multiple) ? "MULTIPLE_CHOICE" : "SINGLE_CHOICE";
  }
  if (text.includes("MULTI")) return "MULTIPLE_CHOICE";
  if (text.includes("SINGLE") || text.includes("RADIO")) return "SINGLE_CHOICE";
  if (text === "FILE" || text.includes("FILE") || text.includes("UPLOAD")) return "FILE_UPLOAD";
  if (text === "NUMBER" || text.includes("NUMBER")) return "NUMBER";
  return "SHORT_TEXT";
};

const toOption = (value: unknown): QuestionOption => {
  if (typeof value === "string") {
    return { value, label: value };
  }
  const data = value as Record<string, unknown>;
  // Backend: <option value="...">Label text</option>
  // fast-xml-parser: { "@_value": "...", "#text": "Label" }
  return {
    id: safeText(data.id || data.optionId) || undefined,
    value: safeText(data["@_value"] || data.value || data.name || data.code || data.label),
    label: safeText(data["#text"] || data.label || data.displayLabel || data["@_value"] || data.value || data.name)
  };
};

const questionXmlId = (data: Record<string, unknown>) =>
  safeText(data["@_id"] ?? data.id ?? data.questionId);

const toQuestion = (payload: Record<string, unknown>): Question => {
  const question = payload.question ?? payload;
  const data = question as Record<string, unknown>;
  // Options may be wrapped in an <options> element with a `multiple` attribute
  const optionsWrapper = data.options as Record<string, unknown> | undefined;
  const multipleAttr = optionsWrapper?.["@_multiple"] ?? optionsWrapper?.multiple;
  const optionsSource = optionsWrapper?.option ?? data.option ?? data.choices ?? [];
  // File properties may come as <file_properties> element (snake_case from backend)
  const fileProps = (data.file_properties ?? data.fileProperties) as Record<string, unknown> | undefined;
  const slug = safeText(data["@_name"] || data.name || data.slug) || slugify(safeText(data.text)) || undefined;

  return {
    id: questionXmlId(data),
    surveyId: safeText(data.surveyId || data.parentSurveyId),
    slug,
    text: safeText(data.text || data.questionText || data.label),
    description: safeText(data.description) || undefined,
    type: toQuestionType(data["@_type"] || data.type || data.questionType, multipleAttr),
    required: toBoolean(data["@_required"] ?? data.required),
    order: toNumber(data.order || data.position || data["@_orderIndex"] || data.order_index, 0),
    options: ensureArray(optionsSource).map(toOption),
    allowMultipleSelections: toBoolean(multipleAttr ?? data.allowMultipleSelections ?? data.multiple),
    fileFormat: fileProps
      ? safeText(fileProps.format || fileProps.fileFormat || fileProps.file_format) || undefined
      : safeText(data.fileFormat || data.file_format) || undefined,
    maxFileSizeMb:
      fileProps && fileProps.maxFileSize !== undefined
        ? toNumber(fileProps.maxFileSize || fileProps.max_file_size_mb, 1)
        : data.maxFileSizeMb !== undefined
          ? toNumber(data.maxFileSizeMb, 1)
          : undefined,
    multipleFiles: fileProps
      ? toBoolean(fileProps.multiple ?? fileProps.multipleFiles ?? fileProps.multiple_files)
      : toBoolean(data.multipleFiles || data.multiple_files),
    minNumber:
      data.min_number !== undefined
        ? toNumber(data.min_number)
        : data.minNumber !== undefined
          ? toNumber(data.minNumber)
          : undefined,
    maxNumber:
      data.max_number !== undefined
        ? toNumber(data.max_number)
        : data.maxNumber !== undefined
          ? toNumber(data.maxNumber)
          : undefined,
    branchOnly: toBoolean(data["@_branch_only"] ?? data.branch_only ?? data.branchOnly ?? false)
  };
};

const toQuestions = (payload: unknown): Question[] => {
  const root = parsePayload<Record<string, unknown>>(payload);
  // Backend returns <questions><question>...</question></questions>
  // The root element is "questions" and items are "question"
  const questionsRoot = root.questions as Record<string, unknown> | undefined;
  const questions = questionsRoot?.question
    ?? root.questions
    ?? root.questionList
    ?? root.items
    ?? root.data
    ?? root.question
    ?? root;
  return ensureArray(questions as Question[] | Question | Record<string, unknown>).map((item) =>
    toQuestion(item as Record<string, unknown>)
  );
};

const buildQuestionXml = (payload: QuestionPayload, questionId?: string) => {
  const question: Record<string, unknown> = {
    name: payload.name,
    text: payload.text,
    description: payload.description ?? "",
    type: payload.type,
    required: payload.required,
    order_index: 0,
    branch_only: payload.branchOnly ?? false
  };

  if (questionId) {
    question.id = questionId;
  }

  if (payload.type === "FILE_UPLOAD") {
    question.file_format = payload.fileFormat ?? ".pdf";
    question.max_file_size_mb = payload.maxFileSizeMb ?? 1;
    question.multiple_files = payload.multipleFiles ?? false;
  }

  if (payload.type === "NUMBER") {
    if (payload.minNumber !== undefined) question.min_number = payload.minNumber;
    if (payload.maxNumber !== undefined) question.max_number = payload.maxNumber;
  }

  if (payload.options.length > 0) {
    const seen = new Set<string>();
    const uniqueOptions = payload.options.filter((option) => {
      const value = option.value.trim();
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
    if (uniqueOptions.length > 0) {
      question.options = {
        option: uniqueOptions.map((option, index) => ({
          value: option.value.trim(),
          label: option.label,
          order_index: index
        }))
      };
    }
  }

  return buildXML({ question });
};

export type PaginatedResponses = {
  items: SurveyResponseSummary[];
  currentPage: number;
  lastPage: number;
  totalCount: number;
};

const toResponses = (payload: unknown): PaginatedResponses => {
  const root = parsePayload<Record<string, unknown>>(payload);
  // Root element is <question_responses current_page="..." last_page="..." total_count="...">
  const wrapper = (root.question_responses ?? root) as Record<string, unknown>;
  const currentPage = toNumber(wrapper["@_current_page"] ?? wrapper.current_page ?? 1);
  const lastPage = toNumber(wrapper["@_last_page"] ?? wrapper.last_page ?? 1);
  const totalCount = toNumber(wrapper["@_total_count"] ?? wrapper.total_count ?? 0);

  const rawItems = ensureArray(
    wrapper.question_response ?? root.question_response ?? root.responses ?? root.items ?? []
  );

  const items = rawItems.map((item) => {
    // DynamicResponseSerializer writes answer keys as flat XML elements
    // e.g. <full_name>John</full_name> <email_address>john@x.com</email_address>
    const data = item as Record<string, unknown>;
    const id = safeText(data.response_id || data["@_response_id"] || data.id);

    // Certificates: <certificates><certificate id="1">filename.pdf</certificate></certificates>
    // CertificateResponseDto uses @JacksonXmlText so fileName is the text content (#text)
    const certsWrapper = data.certificates as Record<string, unknown> | undefined;
    const certItems = ensureArray(
      typeof certsWrapper === "object" && certsWrapper !== null
        ? (certsWrapper as Record<string, unknown>).certificate ?? []
        : []
    );
    const certificates = certItems
      .filter((c) => {
        // skip empty <certificates/> elements
        const cert = c as Record<string, unknown>;
        return cert["@_id"] !== undefined || cert["#text"];
      })
      .map((cert) => {
        const c = cert as Record<string, unknown>;
        return {
          id: safeText(c["@_id"] || c.id),
          // fileName is @JacksonXmlText — comes as #text in fast-xml-parser
          filename: safeText(c["#text"] || c.file_name || c.fileName || c.filename)
        };
      });

    const dateResponded = safeText(data.date_responded || data.dateResponded || data.respondedAt);

    const shortlisted =
      safeText(data.shortlisted).toLowerCase() === "yes" ||
      safeText(data["@_shortlisted"]).toLowerCase() === "yes";
    const answers = parseResponseAnswers(data);
    const identity = deriveResponseIdentity(answers);

    return {
      id,
      surveyId: "",
      fullName: identity.fullName,
      email: identity.email,
      gender: answers.gender || undefined,
      programmingStack: answers.primary_backend_stack
        ? answers.primary_backend_stack.split("|").map((s) => s.trim()).filter(Boolean)
        : answers.programmingStack
          ? answers.programmingStack.split("|").map((s) => s.trim()).filter(Boolean)
          : [],
      certificates,
      respondedAt: dateResponded,
      shortlisted,
      answers // expose raw answers for generic rendering
    } as SurveyResponseSummary & { answers: Record<string, string> };
  });

  return { items, currentPage, lastPage, totalCount };
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
  getQuestions: async (surveyId: string, type?: "survey" | "branch") =>
    toQuestions(
      await requestXml<unknown>({
        url: `/api/surveys/${surveyId}/questions`,
        method: "GET",
        params: type ? { type } : undefined
      })
    ),
  createQuestion: async (surveyId: string, payload: QuestionPayload) =>
    requestXml<unknown>({
      url: `/api/surveys/${surveyId}/questions`,
      method: "POST",
      data: buildQuestionXml(payload)
    }),
  setQuestionBranchOnly: async (surveyId: string, questionId: string, branchOnly: boolean) => {
    if (!/^\d+$/.test(questionId)) {
      throw new Error("Invalid question id. Refresh the page and try again.");
    }
    return requestXml<unknown>({
      url: `/api/surveys/${surveyId}/questions/${questionId}?branch_only=${branchOnly}`,
      method: "PUT"
    });
  },
  updateQuestion: async (surveyId: string, questionId: string, payload: QuestionPayload) => {
    if (!/^\d+$/.test(questionId)) {
      throw new Error("Invalid question id. Refresh the page and try again.");
    }
    return requestXml<unknown>({
      url: `/api/surveys/${surveyId}/questions/${questionId}`,
      method: "PUT",
      data: buildQuestionXml(payload, questionId)
    });
  },
  deleteQuestion: async (surveyId: string, questionId: string) => {
    if (!/^\d+$/.test(questionId)) {
      throw new Error("Invalid question id. Refresh the page and try again.");
    }
    return requestXml<unknown>({
      url: `/api/surveys/${surveyId}/questions/${questionId}`,
      method: "DELETE"
    });
  },
  reorderQuestions: async (surveyId: string, questionIds: string[]) =>
    requestXml<unknown>({
      url: `/api/surveys/${surveyId}/questions/reorder`,
      method: "PUT",
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
    params?: { email?: string; page?: number; size?: number; shortlisted?: boolean }
  ) =>
    toResponses(
      await requestXml<unknown>({
        url: `/api/surveys/${surveyId}/responses`,
        method: "GET",
        params: {
          page: params?.page,
          pageSize: params?.size,
          email: params?.email,
          ...(params?.shortlisted ? { shortlisted: true } : {})
        }
      })
    ),
  addToTalentVault: async (surveyId: string, responseId: string): Promise<ShortlistStatus> => {
    const root = parsePayload<Record<string, unknown>>(
      await requestXml<unknown>({
        url: `/api/surveys/${surveyId}/responses/${responseId}/shortlist`,
        method: "PUT"
      })
    );
    const data = (root.shortlist_status ?? root) as Record<string, unknown>;
    return {
      responseId: safeText(data["@_response_id"] || data.response_id || responseId),
      shortlisted: safeText(data["@_shortlisted"] || data.shortlisted).toLowerCase() === "yes",
      vaultCount: toNumber(data["@_vault_count"] ?? data.vault_count ?? 0)
    };
  },
  removeFromTalentVault: async (surveyId: string, responseId: string): Promise<ShortlistStatus> => {
    const root = parsePayload<Record<string, unknown>>(
      await requestXml<unknown>({
        url: `/api/surveys/${surveyId}/responses/${responseId}/shortlist`,
        method: "DELETE"
      })
    );
    const data = (root.shortlist_status ?? root) as Record<string, unknown>;
    return {
      responseId: safeText(data["@_response_id"] || data.response_id || responseId),
      shortlisted: safeText(data["@_shortlisted"] || data.shortlisted).toLowerCase() === "yes",
      vaultCount: toNumber(data["@_vault_count"] ?? data.vault_count ?? 0)
    };
  },
  downloadCertificate: async (certificateId: string) =>
    api.get(`/api/certificates/${certificateId}`, {
      responseType: "blob",
      headers: { Accept: "application/pdf" }
    }),
  getNextQuestion: async (
    surveyId: string,
    answeredQuestions: string[],
    lastAnswers: Record<string, string | number>
  ): Promise<NextQuestionResponse> => {
    // Backend parseAnswerMap expects "key:value,key:value" format (comma-separated colon-pairs)
    const lastAnswersParam = Object.entries(lastAnswers)
      .map(([k, v]) => `${k}:${v}`)
      .join(",");

    const response = await requestXml<unknown>({
      url: `/api/surveys/${surveyId}/next-question`,
      method: "GET",
      params: {
        answeredQuestions: answeredQuestions.join(","),
        ...(lastAnswersParam ? { lastAnswers: lastAnswersParam } : {})
      }
    });

    // Root element is <next_question>, parsed as root.next_question
    const parsed = parsePayload<Record<string, unknown>>(response);
    const root = (parsed.next_question ?? parsed) as Record<string, unknown>;

    const surveyComplete = toBoolean(root.survey_complete ?? root.surveyComplete ?? root.complete);

    const questionData = root.question as Record<string, unknown> | undefined;
    if (!questionData) {
      return { surveyComplete: surveyComplete || true };
    }

    // Options are wrapped in an <options multiple="yes|no"> element
    const optionsWrapper = questionData.options as Record<string, unknown> | undefined;
    const multipleAttr = optionsWrapper?.["@_multiple"] ?? optionsWrapper?.multiple;
    const optionItems = ensureArray(optionsWrapper?.option ?? questionData.option ?? []);

    return {
      surveyComplete,
      question: {
        // Use the slug (name attribute) as id so the respond page can pass it back as answeredQuestions.
        // The backend's resolveNextQuestion matches by question name/slug, NOT numeric id.
        id: safeText(questionData["@_name"] || questionData.name || questionData["@_id"] || questionData.id),
        text: safeText(questionData.text || questionData.questionText),
        description: safeText(questionData.description) || undefined,
        type: toQuestionType(questionData["@_type"] || questionData.type || questionData.questionType, multipleAttr),
        required: toBoolean(questionData["@_required"] ?? questionData.required),
        options: optionItems.map((option) => {
          const data = option as Record<string, unknown>;
          return {
            value: safeText(data["@_value"] || data.value || data.name || data.label),
            label: safeText(data["#text"] || data.label || data.displayLabel || data["@_value"] || data.value || data.name)
          };
        }),
        allowMultipleSelections: toBoolean(multipleAttr ?? questionData.allowMultipleSelections),
        fileFormat: safeText(questionData.fileFormat || questionData.file_format) || undefined,
        maxFileSizeMb: questionData.maxFileSizeMb ? toNumber(questionData.maxFileSizeMb, 1) : undefined,
        multipleFiles: toBoolean(questionData.multipleFiles || questionData.multiple_files),
        minNumber:
          questionData.min_number !== undefined
            ? toNumber(questionData.min_number)
            : questionData.minNumber !== undefined
              ? toNumber(questionData.minNumber)
              : undefined,
        maxNumber:
          questionData.max_number !== undefined
            ? toNumber(questionData.max_number)
            : questionData.maxNumber !== undefined
              ? toNumber(questionData.maxNumber)
              : undefined
      }
    };
  },
  submitSurveyResponse: async ({ surveyId, email, answers, files }: SurveySubmissionPayload) => {
    const normalizedAnswers = answers
      .map((answer) => ({
        questionId: safeText(answer.questionId).trim(),
        value: Array.isArray(answer.value) ? answer.value.join("|") : safeText(answer.value)
      }))
      .filter((answer) => answer.questionId);

    const xmlPayload = buildXML({
      question_response: {
        answers: {
          answer: normalizedAnswers.map((answer) => ({
            // Backend expects question_name (slug) and answer_value
            question_name: answer.questionId,
            answer_value: answer.value
          }))
        }
      }
    });

    const formData = new FormData();
    // Backend expects the part named "response" (not "xmlPayload")
    formData.append("response", new Blob([xmlPayload], { type: "application/xml" }), "response.xml");
    files.forEach((file) => formData.append("certificates[]", file));

    return api.post(`/api/surveys/${surveyId}/responses`, formData, {
      headers: { "Content-Type": "multipart/form-data", Accept: "application/xml" },
      responseType: "text",
      transformResponse: [(data) => data]
    });
  },
  saveRules: async (surveyId: string, rules: SurveyRulePayload[]) => {
    // Only post rules that don't already have a backend id (new ones)
    const newRules = rules.filter((r) => !r.id);
    for (const rule of newRules) {
      await requestXml<unknown>({
        url: `/api/surveys/${surveyId}/rules`,
        method: "POST",
        data: buildXML({
          skill_tree_rule: {
            source_question_name: rule.sourceQuestionName,
            trigger_value: rule.sourceAnswer,
            target_question_name: rule.targetQuestionName
          }
        })
      });
    }
  },
  createRule: async (surveyId: string, rule: SurveyRulePayload): Promise<SurveyRule> => {
    const response = await requestXml<unknown>({
      url: `/api/surveys/${surveyId}/rules`,
      method: "POST",
      data: buildXML({
        skill_tree_rule: {
          source_question_name: rule.sourceQuestionName,
          trigger_value: rule.sourceAnswer,
          target_question_name: rule.targetQuestionName
        }
      })
    });
    const root = parsePayload<Record<string, unknown>>(response);
    const data = (root.skill_tree_rule ?? root) as Record<string, unknown>;
    return {
      id: safeText(data["@_id"] || data.id) || undefined,
      sourceQuestionName: safeText(data.source_question_name || data.sourceQuestionName),
      sourceAnswer: safeText(data.trigger_value || data.triggerValue || data.sourceAnswer),
      targetQuestionName: safeText(data.target_question_name || data.targetQuestionName)
    };
  },
  getRules: async (surveyId: string): Promise<SurveyRule[]> => {
    const response = await requestXml<unknown>({
      url: `/api/surveys/${surveyId}/rules`,
      method: "GET"
    });
    const root = parsePayload<Record<string, unknown>>(response);
    // Backend returns <skill_tree_rules><skill_tree_rule>...</skill_tree_rule></skill_tree_rules>
    const rulesRoot = root.skill_tree_rules as Record<string, unknown> | undefined;
    const items = ensureArray(
      rulesRoot?.skill_tree_rule ?? root.skill_tree_rules ?? root.skill_tree_rule ?? []
    );
    return items.map((item) => {
      const data = item as Record<string, unknown>;
      return {
        id: safeText(data["@_id"] || data.id) || undefined,
        sourceQuestionName: safeText(data.source_question_name || data.sourceQuestionName),
        sourceAnswer: safeText(data.trigger_value || data.triggerValue || data.sourceAnswer),
        targetQuestionName: safeText(data.target_question_name || data.targetQuestionName)
      };
    });
  },
  deleteRule: async (surveyId: string, ruleId: string) =>
    requestXml<unknown>({
      url: `/api/surveys/${surveyId}/rules/${ruleId}`,
      method: "DELETE"
    }),
  updateRule: async (surveyId: string, ruleId: string, rule: SurveyRulePayload): Promise<SurveyRule> => {
    const response = await requestXml<unknown>({
      url: `/api/surveys/${surveyId}/rules/${ruleId}`,
      method: "PUT",
      data: buildXML({
        skill_tree_rule: {
          source_question_name: rule.sourceQuestionName,
          trigger_value: rule.sourceAnswer,
          target_question_name: rule.targetQuestionName
        }
      })
    });
    const root = parsePayload<Record<string, unknown>>(response);
    const data = (root.skill_tree_rule ?? root) as Record<string, unknown>;
    return {
      id: safeText(data["@_id"] || data.id) || undefined,
      sourceQuestionName: safeText(data.source_question_name || data.sourceQuestionName),
      sourceAnswer: safeText(data.trigger_value || data.triggerValue || data.sourceAnswer),
      targetQuestionName: safeText(data.target_question_name || data.targetQuestionName)
    };
  }
};

export { api };
