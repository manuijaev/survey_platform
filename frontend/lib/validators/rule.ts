import { z } from "zod";

export const ruleSchema = z.object({
  sourceQuestionId: z.string().min(1, "Select a source question"),
  sourceAnswer: z.string().trim().min(1, "Provide the trigger answer"),
  targetQuestionId: z.string().min(1, "Select a target question"),
  comparator: z.enum(["equals", "contains", "greaterThan", "lessThan"]).default("equals")
});

export type RuleFormValues = z.infer<typeof ruleSchema>;
