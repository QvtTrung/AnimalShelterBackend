import { z } from 'zod';

export const rescueSchema = z.object({
  body: z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  required_participants: z.number().min(1, 'At least 1 participant is required'),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
  })
});

export const rescueParticipantSchema = z.object({
  body: z.object({
    users_id: z.string().uuid('Invalid user ID'),
    role: z.enum(['leader', 'member']),
  })
});

export const rescueReportSchema = z.object({
  body: z.object({
    reports_id: z.string().uuid('Invalid report ID'),
    note: z.string().optional(),
    status: z.enum(['success', 'in_progress', 'cancelled']),
  })
});