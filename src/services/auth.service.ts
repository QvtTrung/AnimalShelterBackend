import { directus } from '../config/directus';
// import  config  from '../config/index';
import { UnauthorizedError, DuplicateEmailError } from '../utils/errors';
// import { logger } from '../utils/logger';
import { readMe, registerUser, readUsers, readItems, createItem, deleteItem } from '@directus/sdk';
import { DirectusUser, AppUser, AppUserOrNull, RegisterPayload, UsersQuery } from '../types/directus';
import { extractDirectusData } from '../utils/validation';
import config from '../config/index';

export class AuthService {
  async login(email: string, password: string) {
    try {
      const result = await directus.login( {email, password} );
      
      // Get the user data after successful login
      const directusUser = await directus.request(readMe({
        fields: ['id', 'email', 'first_name', 'last_name']
      }));
      
      // Get the application user data using the Directus user ID
      let appUser: AppUserOrNull = null;
      try {
        const query = {
          filter: { directus_user_id: { _eq: directusUser.id } },
          limit: 1,
          fields: ['*'],
        };
        const res = await directus.request(readItems('users', query));
        appUser = extractDirectusData<AppUser>(res);
      } catch (err: any) {
        console.error('Error fetching application user:', err);
      }
      
      return {
        directusUser: {
          id: directusUser.id,
          email: directusUser.email,
          first_name: directusUser.first_name,
          last_name: directusUser.last_name
        },
        user: appUser,
        token: result.access_token,
        refresh_token: result.refresh_token // Include refresh token for flexibility
      };
    } catch (error) {
      throw new UnauthorizedError(error?.message || 'Invalid email or password');
    }
  }

  async getCurrentUser() {
    try {
      // Get the Directus user data
      const directusUser = await directus.request(readMe({
        fields: ['id', 'email', 'first_name', 'last_name']
      }));

      // Get the application user data using the Directus user ID
      let appUser: AppUserOrNull = null;
      try {
        // Query the users collection (application-level users) not directus_users
        const query = {
          filter: { directus_user_id: { _eq: directusUser.id } },
          limit: 1,
          fields: ['*'],
        };
        const res = await directus.request(readItems('users', query));
        appUser = extractDirectusData<AppUser>(res);
      } catch (err: any) {
        console.error('Error fetching application user:', err);
        // If we can't find the app user, we'll still return the Directus user
      }

      return {
        directusUser: {
          id: directusUser.id,
          email: directusUser.email,
          first_name: directusUser.first_name,
          last_name: directusUser.last_name
        },
        user: appUser
      };
    } catch (error) {
      throw new UnauthorizedError('Not authenticated');
    }
  }

  async register(payload: RegisterPayload) {
    if (config.directus.token) {   
      directus.setToken(config.directus.token);
    }
    // Extract the payload data (validation is already done in the route middleware)
    const { email, password, first_name, last_name } = payload;

    // Check if email already exists in Directus
    let existingUser: DirectusUser | null = null;
    try {
      const query: UsersQuery = {
        filter: { email: { _eq: email } },
        limit: 1,
        fields: ['id', 'email'],
      };
      const res = await directus.request(readUsers(query));
      existingUser = extractDirectusData<DirectusUser>(res);
      
      // // Log the response for debugging
      // console.log('Email check response:', res);
      // console.log('Extracted existing user:', existingUser);
    } catch (err: any) {
      console.error('Error checking email existence:', err);
      throw new UnauthorizedError('Failed to check email existence');
    }
    
    if (existingUser) {
      console.error(`Email ${email} already exists`);
      const duplicateError = new DuplicateEmailError(email);
      console.log('Throwing DuplicateEmailError:', duplicateError);
      
      // Ensure the error is properly thrown with the correct properties
      Object.setPrototypeOf(duplicateError, DuplicateEmailError.prototype);
      throw duplicateError;
    }
    // 1) Register the Directus system user (this endpoint can create users without server token)
    try {
      await directus.request(registerUser(
        email, 
        password, 
        {first_name, 
          last_name}));
    } catch (err: any) {
      throw new UnauthorizedError(err?.message || 'Could not create directus user');
    }

    // 2) Fetch the created Directus user by email to obtain its id using readUsers helper
    let directusUser: DirectusUser | null = null;
    try {
      const query: UsersQuery = {
        filter: { email: { _eq: email } },
        limit: 1,
        fields: ['id', 'email', 'first_name', 'last_name'],
      };
    const res = await directus.request(readUsers(query));
      // Use helper function to extract data safely
      directusUser = extractDirectusData<DirectusUser>(res);
    } catch (err: any) {
      throw new UnauthorizedError(err?.message || 'Registered but failed to fetch created directus user');
    }

    if (!directusUser || !directusUser.id) {
      throw new UnauthorizedError('Could not determine created directus user id');
    }

    const directusUserId = directusUser.id;

    // 4) Create the application-level user in `users` collection and link to directus_users
   

    const appUserData: Omit<AppUser, 'id'> = {
      email,
      status: 'active',
      first_name,
      last_name,
      directus_user_id: directusUserId,
    };

    let createdAppUser: AppUserOrNull = null;
    try {
      // Using createItem function to create the application-level user
      const response = await directus.request(createItem('users', appUserData));
      console.log('App user creation response:', response);
      // For createItem, the response is the created item directly, not wrapped in a data property
      createdAppUser = response as AppUser;
    } catch (err: any) {
      // 5) Rollback: delete the directus system user to avoid orphaned directus_users
      try {
        await directus.request(deleteItem('directus_users', directusUserId));
      } catch (rollbackErr) {
      }

      throw new UnauthorizedError(err?.message || 'Could not create application user');
    }

    // Login after successful registration to get the token
    const loginResult = await directus.login({ email, password });
    directus.setToken('');
    
    return { 
      directusUser, 
      user: createdAppUser,
      token: loginResult.access_token,
      refresh_token: loginResult.refresh_token // Include refresh token for flexibility
    };
  }

  async logout() {
    try {
      await directus.logout();
      return true;
    } catch (error) {
      throw new UnauthorizedError('Error during logout');
    }
  }

  async refreshToken() {
    try {
      // Refresh the access token using Directus SDK
      // This will use the refresh token cookie automatically
      const tokens = await directus.refresh();
      
      if (!tokens || !tokens.access_token) {
        throw new UnauthorizedError('Failed to obtain new access token');
      }

      // Get the current user to verify they are still authenticated
      const directusUser = await directus.request(readMe({
        fields: ['id', 'email', 'first_name', 'last_name']
      }));

      // Get the application user data using the Directus user ID
      let appUser: AppUserOrNull = null;
      try {
        const query = {
          filter: { directus_user_id: { _eq: directusUser.id } },
          limit: 1,
          fields: ['*'],
        };
        const res = await directus.request(readItems('users', query));
        appUser = extractDirectusData<AppUser>(res);
      } catch (err: any) {
        console.error('Error fetching application user:', err);
      }
      
      return {
        directusUser: {
          id: directusUser.id,
          email: directusUser.email,
          first_name: directusUser.first_name,
          last_name: directusUser.last_name
        },
        user: appUser,
        token: tokens.access_token,
        refresh_token: tokens.refresh_token // Include refresh token if needed
      };
    } catch (error: any) {
      console.error('Refresh token error:', error);
      throw new UnauthorizedError('Failed to refresh token. Please login again.');
    }
  }
}