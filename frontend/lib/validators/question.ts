import { z } from "zod";

const optionSchema = z.object({
  value: z.string().trim().min(1, "Option value is required"),
  label: z.string().trim().min(1, "Option label is required")
});

export const questionSchema = z
  .object({
    name: z.string().trim().min(1, "Question slug is required"),
    text: z.string().trim().min(1, "Question text is required"),
    description: z.string().trim().optional().or(z.literal("")),
    type: z.enum([
      "SHORT_TEXT",
      "LONG_TEXT",
      "EMAIL",
      "SINGLE_CHOICE",
      "MULTIPLE_CHOICE",
      "FILE_UPLOAD"
    ]),
    required: z.boolean().default(false),
    options: z.array(optionSchema).default([]),
    allowMultipleSelections: z.boolean().default(false),
    fileFormat: z.string().trim().optional().or(z.literal("")),
    maxFileSizeMb: z.coerce.number().min(1).max(100).optional(),
    multipleFiles: z.boolean().default(false)
  })
  .superRefine((value, ctx) => {
    const needsOptions = value.type === "SINGLE_CHOICE" || value.type === "MULTIPLE_CHOICE";
    const needsFiles = value.type === "FILE_UPLOAD";

    if (needsOptions && value.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Add at least one option"
      });
    }

    if (!needsFiles && value.fileFormat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileFormat"],
        message: "File properties only apply to file uploads"
      });
    }

    if (needsFiles && !value.fileFormat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileFormat"],
        message: "Select a file format"
      });
    }
  });

export type QuestionFormValues = z.infer<typeof questionSchema>;
