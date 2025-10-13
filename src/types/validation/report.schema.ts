import { z } from 'zod';

// Report ID validation
export const reportIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID format'),
  }),
});

// Report multiple images validation
export const reportMultipleImagesSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID format'),
  }),
  body: z.object({}).optional(),
});

// Delete report image validation
export const deleteReportImageSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID format'),
    imageId: z.string().uuid('Invalid image ID format'),
  }),
});
