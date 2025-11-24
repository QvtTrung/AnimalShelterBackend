import { z } from 'zod';

export const notificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.enum(['adoption', 'rescue', 'report', 'system']),
  related_id: z.string().uuid().optional(),
  is_read: z.boolean().default(false),
});

export const updateNotificationSchema = z.object({
  is_read: z.boolean().optional(),
  read_at: z.string().datetime().optional(),
});

export type NotificationInput = z.infer<typeof notificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
