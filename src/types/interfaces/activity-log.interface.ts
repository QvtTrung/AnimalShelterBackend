export interface DirectusActivityLog {
  id?: string;
  status?: string;
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
  
  // Core activity fields
  action: string; // e.g., 'user_registered', 'report_created', 'adoption_requested', 'report_claimed'
  actor_id?: string; // User who performed the action (optional for system events)
  actor_name?: string; // Denormalized name for quick display
  
  // Target entity information
  target_type?: string; // e.g., 'user', 'report', 'adoption', 'rescue', 'pet'
  target_id?: string; // ID of the entity this action relates to
  
  // Additional context
  description: string; // Human-readable description
  details?: Record<string, any>; // JSON object with additional context
  
  // Metadata
  ip_address?: string;
  user_agent?: string;
}

export type ActivityLogCreateInput = Omit<DirectusActivityLog, 'id' | 'status' | 'user_created' | 'date_created' | 'user_updated' | 'date_updated'>;
