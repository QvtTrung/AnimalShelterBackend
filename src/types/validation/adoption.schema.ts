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
    user_id: z.string().uuid('Invalid user ID').optional(),
    status: z.enum(['pending', 'confirming', 'confirmed', 'completed', 'cancelled']).optional().default('pending'),
    appointment_date: z.string().datetime().optional(),
    notes: z.string().max(1000, 'Notes too long').optional(),
    
    // Application form fields
    full_name: z.string().min(1, 'Full name is required').max(255).optional(),
    phone_number: z.string().max(20).optional(),
    email: z.string().email('Invalid email').max(255).optional(),
    address: z.string().max(500).optional(),
    housing_type: z.enum(['apartment', 'house', 'villa']).optional(),
    housing_area: z.number().int().positive().optional(),
    has_yard: z.boolean().optional(),
    pet_experience: z.string().max(2000).optional(),
    adoption_reason: z.string().max(2000).optional(),
    care_commitment: z.string().max(2000).optional()
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
    status: z.enum(['pending', 'confirming', 'confirmed', 'completed', 'cancelled']).optional(),
    approval_date: z.string().datetime().optional(),
    appointment_date: z.string().datetime().optional(),
    notes: z.string().max(1000, 'Notes too long').optional(),
    
    // Application form fields
    full_name: z.string().max(255).optional(),
    phone_number: z.string().max(20).optional(),
    email: z.string().email('Invalid email').max(255).optional(),
    address: z.string().max(500).optional(),
    housing_type: z.enum(['apartment', 'house', 'villa']).optional(),
    housing_area: z.number().int().positive().optional(),
    has_yard: z.boolean().optional(),
    pet_experience: z.string().max(2000).optional(),
    adoption_reason: z.string().max(2000).optional(),
    care_commitment: z.string().max(2000).optional()
  })
});

// Schema for updating adoption status
export const updateAdoptionStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid adoption ID')
  }),
  body: z.object({
    status: z.enum(['pending', 'confirming', 'confirmed', 'completed', 'cancelled'], {
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
