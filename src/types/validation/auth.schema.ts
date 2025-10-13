import { z } from 'zod';

export const RegisterPayloadSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
  })
});

export const LoginPayloadSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  })
});