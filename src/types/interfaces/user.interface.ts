export interface DirectusUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface AppUser {
  id: string;
  email: string;
  status: 'active' | 'inactive';
  sort?: number;
  date_created?: string;
  date_updated?: string;
  first_name: string;
  last_name: string;
  directus_user_id: string;
  phone_number?: string;
  avatar?: string;
  address?: string;
}

export type AppUserOrNull = AppUser | null;

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface UsersQuery {
  filter?: {
    email?: { _eq: string };
    directus_user_id?: { _eq: string };
  };
  limit?: number;
  fields?: string[];
}

export interface CreateUserPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  avatar?: string;
}