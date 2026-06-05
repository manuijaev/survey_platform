import { z } from "zod";

export const responseAnswerSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([z.string(), z.array(z.string())]).optional(),
  files: z.array(z.instanceof(File)).optional()
});

export const surveyResponseSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  answers: z.array(responseAnswerSchema)
});

export type SurveyResponseFormValues = z.infer<typeof surveyResponseSchema>;
