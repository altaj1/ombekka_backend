// src/modules/Eula/eula.validation.ts
import { z } from "zod";

export const EulaValidation = {
  // No specific body validation for upload as it's mainly a file upload
  upload: z.object({}).strict(),
};

export type UploadEulaInput = z.infer<typeof EulaValidation.upload>;
