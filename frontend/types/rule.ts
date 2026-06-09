export type SurveyRule = {
  id?: string;
  sourceQuestionName: string;
  sourceAnswer: string;
  targetQuestionName: string;
};

// Keep legacy alias so api.ts SurveyRulePayload is compatible
export type SurveyRulePayload = SurveyRule;

export type BranchingRule = {
  id: string;
  sourceQuestionName: string;
  triggerValue: string;
  targetQuestionName: string;
};

export type BranchingRuleFormFields = {
  sourceQuestionName: string;
  triggerValue: string;
  targetQuestionName: string;
};

export type BranchingRuleQuestionOption = {
  value: string;
  label: string;
};

export type BranchingRuleQuestion = {
  name: string;
  questionText: string;
  type?: string;
  options?: BranchingRuleQuestionOption[];
};
