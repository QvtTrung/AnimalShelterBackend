export interface PetImage {
  id: string;
  sort?: number;
  user_created?: string;  // reference to directus_users collection
  date_created?: string;
  pet_id?: string;  // reference to pets collection
  image_url?: string;
}