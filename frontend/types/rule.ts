export type SurveyRule = {
  id?: string;
  sourceQuestionId: string;
  sourceAnswer: string;
  targetQuestionId: string;
  comparator?: "equals" | "contains" | "greaterThan" | "lessThan";
};

export type SurveyRulePayload = SurveyRule;
