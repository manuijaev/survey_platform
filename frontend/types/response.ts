import type { QuestionAnswer } from "./question";

export type SurveySubmissionPayload = {
  surveyId: string;
  email?: string;
  answers: QuestionAnswer[];
  files: File[];
};

export type NextQuestionResponse = {
  surveyComplete: boolean;
  question?: {
    id: string;
    text: string;
    description?: string;
    type: string;
    required: boolean;
    options?: Array<{ value: string; label: string }>;
    allowMultipleSelections?: boolean;
    fileFormat?: string;
    maxFileSizeMb?: number;
    multipleFiles?: boolean;
  };
};

export type SurveyResponseRecord = {
  id: string;
  surveyId: string;
  fullName: string;
  email: string;
  gender?: string;
  programmingStack: string[];
  certificates: Array<{ id: string; filename: string }>;
  respondedAt: string;
};
