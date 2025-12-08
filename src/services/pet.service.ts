import { BaseService } from "./base.service";
import { readItems } from '@directus/sdk';

interface Pet {
  id: string;
  name: string;
  species: string;
  status: "adopted" | "pending" | "available" | "archived";
  description?: string;
  age?: number;
  age_unit?: "months" | "years";
  created_at?: Date;
  updated_at?: Date;
}

export class PetService extends BaseService<Pet> {
  constructor() {
    super("pets");
  }

  /** Override findAll to include images - works with both admin (Refine) and public (React Query) */
  async findAll(query?: any) {
    try {
      // Extract pagination parameters
      const page = Number(query?.page) || 1;
      const limit = Number(query?.limit) || Number(query?.pageSize) || 10;
      const offset = (page - 1) * limit;

      // Remove refine-specific pagination params
      const { page: _, limit: __, pageSize: ___, sort, ids, ...restQuery } = query || {};

      // Handle filters - support both Refine format (filter object) and direct query params
      let filter: any = {};
      let fetchingByIds = false;
      
      // Add IDs filter (for fetching specific pets by IDs)
      if (ids) {
        const idArray = typeof ids === 'string' ? ids.split(',') : Array.isArray(ids) ? ids : [ids];
        filter.id = { _in: idArray };
        fetchingByIds = true;
      }
      
      // If Refine passes a filter object (from admin frontend), use it
      if (restQuery.filter) {
        filter = { ...filter, ...restQuery.filter };
      } else {
        // Otherwise build filter from direct query params (from public frontend)
        if (restQuery.status) {
          filter.status = { _eq: restQuery.status };
        }
        if (restQuery.species) {
          filter.species = { _eq: restQuery.species };
        }
        if (restQuery.size) {
          filter.size = { _eq: restQuery.size };
        }
        if (restQuery.search) {
          filter.name = { _contains: restQuery.search };
        }
      }

      // Build query for items WITHOUT images first
      const itemsQuery: any = {
        fields: ['*'],
        limit: fetchingByIds ? -1 : limit,
        offset: fetchingByIds ? 0 : offset,
      };

      // Add filter if exists
      if (Object.keys(filter).length > 0) {
        itemsQuery.filter = filter;
      }

      // Add sort if provided (Refine format: '-field' for desc, 'field' for asc)
      if (sort) {
        itemsQuery.sort = sort;
      }

      // Get paginated pets data
      const items = await this.sdk.request(readItems(this.collection, itemsQuery));

      // Manually fetch images for each pet
      const itemsWithImages = await Promise.all(
        (items || []).map(async (pet: any) => {
          try {
            const images = await this.sdk.request(readItems('pet_images', {
              fields: ['*'],
              filter: { pet_id: { _eq: pet.id } },
            }));
            return {
              ...pet,
              pet_images: images || [],
            };
          } catch (error) {
            console.error(`Error fetching images for pet ${pet.id}:`, error);
            return {
              ...pet,
              pet_images: [],
            };
          }
        })
      );

      // Try to get total count separately - if it fails, use items.length
      let total = items?.length || 0;
      try {
        const countResponse = await this.sdk.request(readItems(this.collection, {
          aggregate: { count: '*' },
          ...(Object.keys(filter).length > 0 ? { filter } : {}),
        }));
        
        total = countResponse?.[0]?.count ?? items?.length ?? 0;
      } catch (countError) {
        // If aggregate fails, estimate total based on current page
        total = items?.length === limit ? (page * limit) + 1 : (page - 1) * limit + (items?.length || 0);
      }

      return {
        data: Array.isArray(itemsWithImages) ? itemsWithImages : [],
        total,
      };
    } catch (error) {
      throw error;
    }
  }

  /** Override findOne to include images - works for both admin and public */
  async findOne(id: string, _query?: any): Promise<any> {
    try {
      const items = await this.sdk.request(readItems(this.collection, {
        fields: ['*'],
        filter: { id: { _eq: id } },
        limit: 1,
      }));
      
      const pet = items?.[0];
      if (!pet) return null;

      // Manually fetch images
      try {
        const images = await this.sdk.request(readItems('pet_images', {
          fields: ['*'],
          filter: { pet_id: { _eq: pet.id } },
        }));
        return {
          ...pet,
          pet_images: images || [],
        };
      } catch (error) {
        console.error(`Error fetching images for pet ${pet.id}:`, error);
        return {
          ...pet,
          pet_images: [],
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /** Lấy danh sách thú cưng có status = "available" */
  async findAvailable(query?: any) {
    try {
      return await this.findAll({
        ...query,
        filter: { status: { _eq: "available" } },
      });
    } catch (error) {
      throw error;
    }
  }
}
