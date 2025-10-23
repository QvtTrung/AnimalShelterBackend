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
      // Ensure we get total count for pagination
      const queryWithMeta = {
        ...query,
        meta: '*',
      };
      
      const result = await directus.request(readItems(this.collection, queryWithMeta));
      
      // Return both data and pagination metadata
      const items = Array.isArray(result) ? result : [];
      return {
        data: items,
        total: items.length && items[0]?.__v?.total_count ? items[0].__v.total_count : items.length,
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