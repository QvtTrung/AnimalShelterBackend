import { BaseService } from './base.service';
import { AppUser, CreateUserPayload, DirectusUser } from '../types/directus';
import { directus } from '../config/directus';
import { createUser, readUsers, createItem, deleteItem, updateItem, updateUser, readRoles, readItems, readMe } from '@directus/sdk';
import { extractDirectusData } from '../utils/validation';
import { DuplicateEmailError } from '../utils/errors';

export class UserService extends BaseService<AppUser> {
  constructor() {
    super('users');
  }

  // Override the base create method to maintain compatibility
  async create(data: Partial<AppUser>) {
    return super.create(data);
  }

  // Override the update method to handle the users collection correctly
  async update(id: string, data: Partial<AppUser>) {
    try {
      // For the users collection, we need to use the updateItem function with a specific approach
      return await directus.request(updateItem('users', id, data));
    } catch (error) {
      throw error;
    }
  }

  // Note: The update method is overridden below to handle the users collection correctly

  // New method for creating users with password
  async createUserWithPassword(payload: CreateUserPayload): Promise<AppUser> {
    const { email, password, first_name, last_name, phone_number, address, avatar, role } = payload;

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
      // Get role ID from role name
      let roleId = null;
      if (role) {
        const roles = await directus.request(readRoles({
          filter: { name: { _eq: role } },
          limit: 1
        }));
        if (roles && roles.length > 0) {
          roleId = roles[0].id;
        }
      }
      
      await directus.request(createUser({
        email,
        password,
        first_name,
        last_name,
        role: roleId
      }));
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
      avatar,
      role: role as 'Administrator' | 'Staff' | 'User'
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

  async findOneWithRole(id: string) {
    try {
      const user = await this.findOne(id);
      if (!user || !user.directus_user_id) return user;

      // Try to get the role from readMe() if this is the authenticated user
      // Otherwise, try to get it from readUsers (which requires admin permissions)
      try {
        const currentUser = await directus.request(readMe({
          fields: ['id', 'role']
        }));
        
        // Check if this is the same user as the one we're fetching
        if (currentUser && currentUser.id === user.directus_user_id && currentUser.role) {
          // Get the role name
          const roles = await directus.request(readRoles({
            filter: { id: { _eq: currentUser.role } },
            fields: ['id', 'name'],
            limit: 1
          }));

          if (roles && roles.length > 0) {
            user.role = roles[0].name;
          }
        } else {
          // If not the same user, try readUsers (requires admin)
          const directusUsers = await directus.request(readUsers({
            filter: { id: { _eq: user.directus_user_id } },
            fields: ['id', 'role'],
            limit: 1
          }));

          if (directusUsers && directusUsers.length > 0 && directusUsers[0].role) {
            const roles = await directus.request(readRoles({
              filter: { id: { _eq: directusUsers[0].role } },
              fields: ['id', 'name'],
              limit: 1
            }));

            if (roles && roles.length > 0) {
              user.role = roles[0].name;
            }
          }
        }
      } catch (roleError) {
        // If we can't get the role, just return the user without it
        console.log('Could not fetch role for user:', roleError);
      }

      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async findAllWithRoles(query?: any) {
    try {
      // Handle pagination parameters
      const page = Number(query?.page) || 1;
      const limit = Number(query?.limit) || Number(query?.pageSize) || 10;
      const offset = (page - 1) * limit;

      // Remove refine-specific pagination params to avoid conflicts
      const { page: _, limit: __, pageSize: ___, ...restQuery } = query || {};

      // First get total count
      const countResponse = await directus.request(readItems(this.collection, {
        aggregate: { count: '*' },
        ...restQuery?.filter ? { filter: restQuery.filter } : {},
      }));

      const total = countResponse?.[0]?.count ?? 0;

      // Then get paginated data
      const items = await directus.request(readItems(this.collection, {
        ...restQuery,
        limit,
        offset,
      }));

      const result = {
        data: Array.isArray(items) ? items : [],
        total,
      };

      // For each user, get their role
      for (const user of result.data) {
        if (user && user.directus_user_id) {
          // Get the Directus user with role
          const directusUsers = await directus.request(readUsers({
            filter: { id: { _eq: user.directus_user_id } },
            fields: ['id', 'role'],
            limit: 1
          }));

          if (directusUsers && directusUsers.length > 0 && directusUsers[0].role) {
            // Get the role name
            const roles = await directus.request(readRoles({
              filter: { id: { _eq: directusUsers[0].role } },
              fields: ['id', 'name'],
              limit: 1
            }));

            if (roles && roles.length > 0) {
              user.role = roles[0].name;
            }
          }
        }
      }

      return result;
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
      const { password, role, ...appUserData } = data;
      
      // If password is provided, update the Directus user password
      if (password) {
        // Get the app user to find the Directus user ID
        const appUser = await this.findOne(id);
        if (!appUser || !appUser.directus_user_id) {
          throw new Error('User not found or no Directus user associated');
        }
        
        // Update Directus user password
        try {
          await directus.request(updateUser(appUser.directus_user_id, { password }));
        } catch (err: any) {
          throw new Error(err?.message || 'Failed to update Directus user password');
        }
      }
      
      // Handle role update
      if (role) {
        const appUser = await this.findOne(id);
        if (!appUser || !appUser.directus_user_id) {
          throw new Error('User not found or no Directus user associated');
        }
        
        // Get role ID from role name
        const roles = await directus.request(readRoles({
          filter: { name: { _eq: role } },
          limit: 1
        }));
        
        if (roles && roles.length > 0) {
          // Update Directus user role
          await directus.request(updateUser(appUser.directus_user_id, { 
            role: roles[0].id 
          }));
        }
      }
      
      // Update app user data
      return await this.update(id, appUserData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCurrentAuthenticatedUser() {
    try {
      // Get the user from Directus
      const directusUser = await directus.request(readMe({
        fields: ['id', 'email', 'first_name', 'last_name']
      }));

      if (!directusUser || !directusUser.id) {
        throw new Error('No authenticated user found');
      }

      // Get the application user data using the Directus user ID
      const user = await this.findByDirectusUserId(directusUser.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get the user with role information
      const userWithRole = await this.findOneWithRole(user.id);
      return userWithRole;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCurrentAuthenticatedUser(data: Partial<AppUser>) {
    try {
      // Get the user from Directus
      console.log('Attempting to get current user with readMe...');
      const directusUser = await directus.request(readMe({
        fields: ['id', 'email', 'first_name', 'last_name']
      }));
      console.log('Got directus user:', directusUser);

      if (!directusUser || !directusUser.id) {
        throw new Error('No authenticated user found');
      }

      // Get the application user data using the Directus user ID
      const user = await this.findByDirectusUserId(directusUser.id);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Update the user profile
      await this.updateUserProfile(user.id, data);
      
      // Fetch the updated user with role information
      const userWithRole = await this.findOneWithRole(user.id);
      return userWithRole;
    } catch (error: any) {
      console.error('Error in updateCurrentAuthenticatedUser:', error.message, error.errors);
      throw this.handleError(error);
    }
  }
}
