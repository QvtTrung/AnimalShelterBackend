import { directus } from '../config/directus';
import { createItem, readItems, updateItem, deleteItem } from '@directus/sdk';

export class BaseService<T> {
  protected sdk = directus;
  
  constructor(protected collection: string) {}

  protected handleError(error: any): never {
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }

  async findAll(query?: any): Promise<{ data: any[]; total: number }> {
    try {
      // Extract pagination parameters - handle both refine and directus formats
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

      return {
        data: Array.isArray(items) ? items : [],
        total,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string, query?: any) {
    try {
      const items = await directus.request(readItems(this.collection, {
        ...query,
        filter: { id: { _eq: id } },
        limit: 1,
      }));
      return items?.[0];
    } catch (error) {
      throw error;
    }
  }

  async create(data: Partial<T>) {
    try {
      return await directus.request(createItem(this.collection, data));
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, data: Partial<T>) {
    try {
      return await directus.request(updateItem(this.collection, id, data));
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string) {
    try {
      await directus.request(deleteItem(this.collection, id));
      return true;
    } catch (error) {
      throw error;
    }
  }
}