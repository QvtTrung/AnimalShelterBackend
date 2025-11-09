export interface DirectusAdoption {
  id: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'completed' | 'cancelled';
  sort?: number;
  user_created?: string;  // reference to directus_users collection
  date_created?: string;
  user_updated?: string;  // reference to directus_users collection
  date_updated?: string;
  pet_id?: string;   // reference to pets collection
  user_id?: string;  // reference to users collection (app user)
  approval_date?: string;
  appointment_date?: string;
  notes?: string;
  confirmation_sent_at?: string;
  confirmation_expires_at?: string;
}