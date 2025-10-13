import { z } from 'zod';
import { AppError } from './errors';

// Generic validation error response
export const ValidationErrorResponse = z.object({
  message: z.string(),
  issues: z.array(z.object({
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string(),
    code: z.string(),
  })),
});

// Format Zod errors into standardized AppError
export function formatZodError(error: z.ZodError): AppError {
  const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
  return new AppError(400, 'fail', errorMessages.join(', '));
}

// Helper function to validate and parse data
export function validateAndParse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw formatZodError(error);
    }
    throw error;
  }
}

// Async version of validateAndParse
export async function validateAndParseAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw formatZodError(error);
    }
    throw error;
  }
}

// Helper function to safely extract data from Directus response
export function extractDirectusData<T>(response: unknown): T | null {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data: T[] }).data;
    return data && data.length > 0 ? data[0] : null;
  }
  if (Array.isArray(response) && response.length > 0) {
    return response[0] as T;
  }
  return null;
}

// File validation schema
export const fileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number(),
  destination: z.string().optional(),
  filename: z.string().optional(),
  path: z.string().optional(),
});

// File upload validation schema
export const fileUploadSchema = z.object({
  file: fileSchema.optional(),
  files: z.union([
    z.array(fileSchema),
    z.record(z.string(), z.array(fileSchema))
  ]).optional(),
});

// Validate file upload
export function validateFileUpload(file: Express.Multer.File | undefined, files: Express.Multer.File[] | Record<string, Express.Multer.File[]> | undefined): void {
  // For single file upload
  if (!file && (!files || (Array.isArray(files) && files.length === 0))) {
    throw new AppError(400, 'fail', 'No files uploaded');
  }

  const allFiles = file ? [file] : 
    (Array.isArray(files) ? files : 
    (files ? Object.values(files).flat() : []));

  for (const file of allFiles) {
    if (!file) continue;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError(400, 'fail', `File ${file.originalname} is too large. Maximum size is 5MB`);
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError(400, 'fail', `File ${file.originalname} has invalid type. Allowed types: JPG, PNG, GIF`);
    }
  }
}
