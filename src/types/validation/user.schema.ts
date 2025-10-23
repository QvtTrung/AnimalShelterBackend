import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    phone_number: z.string().optional(),
    address: z.string().optional(),
    avatar: z.string().optional()
  })
});

export const updateUserSchema = z.object({
  body: createUserSchema.shape.body.partial(),
  params: z.object({
    id: z.string().uuid('Invalid user ID')
  })
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID')
  })
});

export const userEmailSchema = z.object({
  params: z.object({
    email: z.string().email('Invalid email address')
  })
});
