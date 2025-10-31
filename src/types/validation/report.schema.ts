import { z } from 'zod';

// Create report validation
export const createReportSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Report title is required'),
    description: z.string().min(1, 'Report description is required'),
    species: z.string().min(1, 'Species is required'),
    type: z.enum(['abuse', 'abandonment', 'injured_animal', 'other'], {
      required_error: 'Report type is required'
    }),
    urgency_level: z.enum(['low', 'medium', 'high', 'critical'], {
      required_error: 'Urgency level is required'
    }),
    location: z.string().min(1, 'Location is required'),
    status: z.enum(['pending', 'assigned', 'resolved']).default('pending'),
    linked_pet: z.string().uuid('Invalid pet ID').optional(),
    coordinates: z.object({
      type: z.literal("Point"),
      coordinates: z.tuple([
        z.number(), // longitude
        z.number(), // latitude
      ])
    }).optional()
  })
});

// Update report validation
export const updateReportSchema = z.object({
  body: createReportSchema.shape.body.partial(),
  params: z.object({
    id: z.string().uuid('Invalid report ID')
  })
});

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
  body: z.object({
    imageCount: z.number().int().min(1).max(5).default(1)
  })
});

// Delete report image validation
export const deleteReportImageSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID format'),
    imageId: z.string().uuid('Invalid image ID format'),
  }),
});
