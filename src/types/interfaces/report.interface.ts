export interface DirectusReport {
  id: string;
  status: 'pending' | 'assigned' | 'resolved';
  sort?: number;
  user_created?: string;  // reference to directus_users collection
  date_created?: string;
  user_updated?: string;  // reference to directus_users collection
  date_updated?: string;
  species?: string;
  description?: string;
  reporter?: string; // reference to directus_users collection
  location?: string; // This is a point type in the database
  title?: string;
  type?: string;
  urgency_level?: string;
}