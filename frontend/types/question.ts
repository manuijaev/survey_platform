export type QuestionType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "EMAIL"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "FILE_UPLOAD"
  | "NUMBER"
  | "SYSTEM_DESIGN";

export type QuestionOption = {
  id?: string;
  value: string;
  label: string;
};

export type Question = {
  id: string;
  surveyId: string;
  slug?: string;
  text: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  order?: number;
  options: QuestionOption[];
  allowMultipleSelections?: boolean;
  fileFormat?: string;
  maxFileSizeMb?: number;
  multipleFiles?: boolean;
  minNumber?: number;
  maxNumber?: number;
  branchOnly?: boolean;
};

export type QuestionPayload = {
  name: string;
  text: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options: QuestionOption[];
  allowMultipleSelections?: boolean;
  fileFormat?: string;
  maxFileSizeMb?: number;
  multipleFiles?: boolean;
  minNumber?: number;
  maxNumber?: number;
  branchOnly?: boolean;
};

export type QuestionAnswer = {
  questionId: string;
  value: string | string[] | number;
  files?: File[];
};
