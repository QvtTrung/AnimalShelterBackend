import { z } from 'zod';

export const activityLogSchema = z.object({
  action: z.string().min(1).max(100),
  actor_id: z.string().uuid().optional(),
  actor_name: z.string().max(255).optional(),
  target_type: z.string().max(50).optional(),
  target_id: z.string().uuid().optional(),
  description: z.string().min(1),
  details: z.record(z.any()).optional(),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().optional(),
});

export const getActivityLogsSchema = z.object({
  action: z.string().optional(),
  actor_id: z.string().uuid().optional(),
  target_type: z.string().optional(),
  target_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export type ActivityLogInput = z.infer<typeof activityLogSchema>;
export type GetActivityLogsQuery = z.infer<typeof getActivityLogsSchema>;
