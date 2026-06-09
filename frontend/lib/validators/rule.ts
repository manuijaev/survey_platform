import { z } from "zod";

export const ruleSchema = z.object({
  sourceQuestionName: z.string().min(1, "Enter the source question slug"),
  sourceAnswer: z.string().trim().min(1, "Provide the trigger answer value"),
  targetQuestionName: z.string().min(1, "Enter the target question slug")
});

export type RuleFormValues = z.infer<typeof ruleSchema>;
