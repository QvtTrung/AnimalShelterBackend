import { BaseService } from './base.service';
import { AppUser } from '../types/directus';

export class UserService extends BaseService<AppUser> {
  constructor() {
    super('users');
  }

  async findByDirectusUserId(directusUserId: string) {
    try {
      const users = await this.findAll({
        filter: {
          directus_user_id: { _eq: directusUserId }
        },
        limit: 1
      });
      return users?.[0];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async findByEmail(email: string) {
    try {
      const users = await this.findAll({
        filter: {
          email: { _eq: email }
        },
        limit: 1
      });
      return users?.[0];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUserProfile(id: string, data: Partial<AppUser>) {
    try {
      return await this.update(id, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
