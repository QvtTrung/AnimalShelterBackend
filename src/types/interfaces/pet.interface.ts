export interface DirectusPet {
  id: string;
  status: 'available' | 'pending' | 'adopted' | 'archived';
  sort?: number;
  user_created?: string;  // reference to directus_users collection
  date_created?: string;
  user_updated?: string;  // reference to directus_users collection
  date_updated?: string;
  name?: string;
  species?: string;
  description?: string;
  age?: number;
  age_unit?: 'months' | 'years';
  size?: 'small' | 'medium' | 'large';
  health_status?: 'healthy' | 'needs_attention' | 'critical' | 'deceased';
  linked_report?: string; // reference to reports collection
  gender?: string;
}