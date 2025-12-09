import { z } from 'zod';

export const createPetSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Pet name is required'),
    species: z.string({
      required_error: 'Species is required'
    }),
    age: z.number().int().min(0).optional(),
    age_unit: z.enum(['years', 'months']).optional(),
    gender: z.enum(['male', 'female', 'unknown'], {
      required_error: 'Gender is required'
    }),
    size: z.enum(['small', 'medium', 'large']).optional(),
    health_status: z.enum(['healthy', 'needs_attention', 'critical', 'deceased'], {
      required_error: 'Health status is required'
    }),
    description: z.string().max(5000, 'Description is too long').optional(),
    status: z.enum(['available', 'pending', 'adopted', 'archived'])
      .default('available'),
    linked_report: z.string().uuid('Invalid report ID').optional()
  })
});

export const updatePetSchema = z.object({
  body: createPetSchema.shape.body.partial(),
  params: z.object({
    id: z.string().uuid('Invalid pet ID')
  })
});

export const petIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid pet ID')
  })
});

// export const petImageSchema = z.object({
//   params: z.object({
//     id: z.string().uuid('Invalid pet ID')
//   })
// });

// export const petMultipleImagesSchema = z.object({
//   params: z.object({
//     id: z.string().uuid('Invalid pet ID')
//   }),
//   body: z.object({
//     imageCount: z.number().int().min(1).max(5).default(1)
//   })
// });

export const deletePetImageSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid pet ID'),
    imageId: z.string().uuid('Invalid image ID')
  })
});