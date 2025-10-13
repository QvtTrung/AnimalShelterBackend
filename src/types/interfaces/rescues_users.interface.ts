export interface RescueUser {
  id: number;
  rescues_id?: string;  // reference to rescues collection
  users_id?: string;    // reference to users collection
  role?: string;
  created_at?: string;
  updated_at?: string;
}