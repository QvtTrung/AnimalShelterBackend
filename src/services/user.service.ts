import { BaseService } from './base.service';
import { AppUser, CreateUserPayload, DirectusUser } from '../types/directus';
import { directus } from '../config/directus';
import { registerUser, readUsers, createItem, deleteItem, updateItem } from '@directus/sdk';
import { extractDirectusData } from '../utils/validation';
import { DuplicateEmailError } from '../utils/errors';

export class UserService extends BaseService<AppUser> {
  constructor() {
    super('users');
  }

  async create(payload: CreateUserPayload) {
    const { email, password, first_name, last_name, phone_number, address, avatar } = payload;

    // Check if email already exists in Directus
    let existingUser = null;
    try {
      const query = {
        filter: { email: { _eq: email } },
        limit: 1,
        fields: ['id', 'email'],
      };
      const res = await directus.request(readUsers(query));
      existingUser = extractDirectusData(res);
    } catch (err: any) {
      console.error('Error checking email existence:', err);
      throw new Error('Failed to check email existence');
    }

    if (existingUser) {
      throw new DuplicateEmailError(email);
    }

    // Create the Directus user
    let directusUser: DirectusUser | null = null;
    try {
      await directus.request(registerUser(
        email,
        password,
        {first_name,
          last_name}
      ));
    } catch (err: any) {
      throw new Error(err?.message || 'Could not create directus user');
    }

    // Fetch the created Directus user by email
    try {
      const query = {
        filter: { email: { _eq: email } },
        limit: 1,
        fields: ['id', 'email', 'first_name', 'last_name'],
      };
      const res = await directus.request(readUsers(query));
      directusUser = extractDirectusData(res);
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to fetch created directus user');
    }

    if (!directusUser || !directusUser.id) {
      throw new Error('Could not determine created directus user id');
    }

    const directusUserId = directusUser.id;

    // Create the application-level user
    const appUserData: Omit<AppUser, 'id'> = {
      email,
      status: 'active',
      first_name,
      last_name,
      directus_user_id: directusUserId,
      phone_number,
      address,
      avatar
    };

    let createdAppUser: AppUser | null = null;
    try {
      const response = await directus.request(createItem('users', appUserData));
      createdAppUser = response as AppUser;
    } catch (err: any) {
      // Rollback: delete the directus system user to avoid orphaned directus_users
      try {
        await directus.request(deleteItem('directus_users', directusUserId));
      } catch (rollbackErr) {
        console.error('Failed to rollback Directus user:', rollbackErr);
      }

      throw new Error(err?.message || 'Could not create application user');
    }

    return createdAppUser;
  }

  async findByDirectusUserId(directusUserId: string) {
    try {
      const result = await this.findAll({
        filter: {
          directus_user_id: { _eq: directusUserId }
        },
        limit: 1
      });
      return result.data?.[0];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async findByEmail(email: string) {
    try {
      const result = await this.findAll({
        filter: {
          email: { _eq: email }
        },
        limit: 1
      });
      return result.data?.[0];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUserProfile(id: string, data: Partial<AppUser> & { password?: string }) {
    try {
      const { password, ...appUserData } = data;
      
      // If password is provided, update the Directus user password
      if (password) {
        // Get the app user to find the Directus user ID
        const appUser = await this.findOne(id);
        if (!appUser || !appUser.directus_user_id) {
          throw new Error('User not found or no Directus user associated');
        }
        
        // Update Directus user password
        try {
          await directus.request(updateItem('directus_users', appUser.directus_user_id, { password }));
        } catch (err: any) {
          throw new Error(err?.message || 'Failed to update Directus user password');
        }
      }
      
      // Update app user data
      return await this.update(id, appUserData);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
