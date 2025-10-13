import { BaseService } from './base.service';
import { DirectusAdoption } from '../types/directus';

export class AdoptionService extends BaseService<DirectusAdoption> {
  constructor() {
    super('adoptions');
  }

  async getUserAdoptions(userId: string) {
    try {
      return await this.findAll({
        filter: {
          user_id: { _eq: userId }
        }
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPetAdoptions(petId: string) {
    try {
      return await this.findAll({
        filter: {
          pet_id: { _eq: petId }
        }
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAdoptionStatus(id: string, status: 'planned' | 'in_progress' | 'completed' | 'cancelled') {
    try {
      return await this.update(id, { status });
    } catch (error) {
      throw this.handleError(error);
    }
  }
}