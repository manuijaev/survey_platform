import { z } from "zod";

export const surveySchema = z.object({
  name: z.string().trim().min(1, "Survey name is required").max(160, "Keep the name under 160 characters"),
  description: z.string().trim().max(1000, "Keep the description under 1000 characters").optional().or(z.literal(""))
});

export type SurveyFormValues = z.infer<typeof surveySchema>;
