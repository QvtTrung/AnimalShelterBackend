export interface DirectusReport {
  id: string;
  status: 'pending' | 'assigned' | 'resolved';
  sort?: number;
  user_created?: string;  // reference to directus_users collection
  date_created?: string;
  user_updated?: string;  // reference to directus_users collection
  date_updated?: string;
  species: string;
  description: string;
  location: string; // This is a point type in the database
  title: string;
  type: 'abuse' | 'abandonment' | 'injured_animal' | 'other';
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  // linked_pet?: string; // reference to pets collection
  coordinates?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}