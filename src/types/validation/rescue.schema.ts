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
  }),
  params: z.object({
    id: z.string().uuid('Invalid rescue ID'),
  })
});

export const rescueReportSchema = z.object({
  body: z.object({
    reports_id: z.string().uuid('Invalid report ID'),
    note: z.string().optional(),
    status: z.enum(['in_progress', 'success', 'cancelled']).optional(),
  })
});

export const rescueReportProgressSchema = z.object({
  body: z.object({
    status: z.enum(['in_progress', 'success', 'cancelled']),
    note: z.string().optional(),
  }),
  params: z.object({
    rescueReportId: z.string(), // Can be number or string depending on DB
  })
});

export const cancelRescueSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid rescue ID'),
  })
});