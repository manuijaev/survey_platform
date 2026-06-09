import { z } from "zod";

const optionSchema = z.object({
  value: z.string().trim().min(1, "Option value is required"),
  label: z.string().trim().min(1, "Option label is required")
});

export const questionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(/^[a-z][a-z0-9_]*$/, "Slug must start with a letter and contain only lowercase letters, numbers, and underscores"),
    text: z.string().trim().min(1, "Question text is required"),
    description: z.string().trim().optional().or(z.literal("")),
    type: z.enum([
      "SHORT_TEXT",
      "LONG_TEXT",
      "EMAIL",
      "SINGLE_CHOICE",
      "MULTIPLE_CHOICE",
      "FILE_UPLOAD",
      "NUMBER",
      "SYSTEM_DESIGN"
    ]),
    required: z.boolean().default(false),
    options: z.array(optionSchema).default([]),
    allowMultipleSelections: z.boolean().default(false),
    fileFormat: z.string().trim().optional().or(z.literal("")),
    maxFileSizeMb: z.coerce.number().min(1).max(100).optional(),
    multipleFiles: z.boolean().default(false),
    minNumber: z.coerce.number().optional(),
    maxNumber: z.coerce.number().optional()
  })
  .transform((value) => {
    if (value.type !== "FILE_UPLOAD") {
      return { ...value, fileFormat: "", maxFileSizeMb: undefined, multipleFiles: false };
    }
    return value;
  })
  .superRefine((value, ctx) => {
    const needsOptions = value.type === "SINGLE_CHOICE" || value.type === "MULTIPLE_CHOICE";
    const needsFiles = value.type === "FILE_UPLOAD";
    const isNumber = value.type === "NUMBER";

    if (needsOptions && value.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Add at least one option"
      });
    }

    if (needsFiles && !value.fileFormat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileFormat"],
        message: "Select a file format"
      });
    }

    if (isNumber && value.minNumber !== undefined && value.maxNumber !== undefined) {
      if (value.minNumber > value.maxNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxNumber"],
          message: "Max number must be greater than or equal to min number"
        });
      }
    }
  });

export type QuestionFormValues = z.infer<typeof questionSchema>;
