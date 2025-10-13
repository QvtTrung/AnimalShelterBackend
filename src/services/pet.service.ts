import { BaseService } from './base.service';

interface Pet {
  id: string;
  name: string;
  species: string;
  status: 'adopted' | 'pending' | 'available' | 'archived';
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class PetService extends BaseService<Pet> {
  constructor() {
    super('pets');
  }

  async findAvailable(query?: any) {
    try {
      return await this.findAll({
        ...query,
        filter: { status: { _eq: 'available' } },
      });
    } catch (error) {
      throw error;
    }
  }
}