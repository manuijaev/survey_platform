export type Survey = {
  id: string;
  name: string;
  description?: string;
  responseCount: number;
  lastUpdated?: string;
  active?: boolean;
};

export type SurveySummary = Survey & {
  createdAt?: string;
};

export type SurveyPayload = {
  name: string;
  description?: string;
};

export type SurveyResponseSummary = {
  id: string;
  surveyId: string;
  fullName: string;
  email: string;
  gender?: string;
  programmingStack: string[];
  certificates: Array<{ id: string; filename: string }>;
  respondedAt: string;
};
