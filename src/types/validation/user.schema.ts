import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    directus_user_id: z.string({
      required_error: 'Directus user ID is required'
    })
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
