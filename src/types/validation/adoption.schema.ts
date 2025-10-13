import { z } from 'zod';

// Base schema for adoption ID
export const adoptionIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid adoption ID')
  })
});

// Schema for creating a new adoption
export const createAdoptionSchema = z.object({
  body: z.object({
    pet_id: z.string().uuid('Invalid pet ID'),
    user_id: z.string().uuid('Invalid user ID'),
    status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional().default('planned'),
    notes: z.string().max(1000, 'Notes too long').optional()
  })
});

// Schema for updating an adoption
export const updateAdoptionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid adoption ID')
  }),
  body: z.object({
    pet_id: z.string().uuid('Invalid pet ID').optional(),
    user_id: z.string().uuid('Invalid user ID').optional(),
    status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
    approval_date: z.string().datetime().optional(),
    notes: z.string().max(1000, 'Notes too long').optional()
  })
});

// Schema for updating adoption status
export const updateAdoptionStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid adoption ID')
  }),
  body: z.object({
    status: z.enum(['planned', 'in_progress', 'completed', 'cancelled'], {
      required_error: 'Status is required'
    })
  })
});

// Schema for user ID parameter
export const userIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID')
  })
});

// Schema for pet ID parameter
export const petIdSchema = z.object({
  params: z.object({
    petId: z.string().uuid('Invalid pet ID')
  })
});
