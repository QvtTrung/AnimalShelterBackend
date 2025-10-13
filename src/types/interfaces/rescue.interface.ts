export interface DirectusRescue {
  id: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  sort?: number;
  user_created?: string;  // reference to directus_users collection
  date_created?: string;
  user_updated?: string;  // reference to directus_users collection
  date_updated?: string;
  required_participants?: number;
  title?: string;
  description?: string;
}