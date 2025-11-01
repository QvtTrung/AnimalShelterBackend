import { BaseService } from "./base.service";

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
