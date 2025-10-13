export interface DirectusAdoption {
  id: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  sort?: number;
  user_created?: string;  // reference to directus_users collection
  date_created?: string;
  user_updated?: string;  // reference to directus_users collection
  date_updated?: string;
  pet_id?: string;   // reference to pets collection
  user_id?: string;  // reference to directus_users collection
  approval_date?: string;
  notes?: string;
}