import { BaseService } from './base.service';
import { DirectusAdoption } from '../types/directus';
import { NotificationService } from './notification.service';
import { PetService } from './pet.service';
import { AppError } from '../utils/errors';

export class AdoptionService extends BaseService<DirectusAdoption> {
  private notificationService: NotificationService;
  private petService: PetService;

  constructor() {
    super('adoptions');
    this.notificationService = new NotificationService();
    this.petService = new PetService();
  }

  /**
   * Override findAll to include related pet and user data
   */
  async findAll(query?: any): Promise<{ data: any[]; total: number }> {
    try {
      // Add fields to include related data using Directus deep query syntax
      const queryWithFields = {
        ...query,
        fields: query?.fields || [
          '*',
          { pet_id: ['*'] },  // Deep query for pet_id relationship
          { user_id: ['*'] }  // Deep query for user_id relationship  
        ]
      };

      // console.log('📋 AdoptionService.findAll - Query:', JSON.stringify(queryWithFields, null, 2));

      const result = await super.findAll(queryWithFields);
      
      // console.log('✅ AdoptionService.findAll - First result:', JSON.stringify(result.data[0], null, 2));

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Override findOne to include related pet and user data
   */
  async findOne(id: string, fields?: string[]) {
    try {
      const queryWithFields = {
        fields: fields || [
          '*',
          { pet_id: ['*'] },  // Deep query for pet_id relationship
          { user_id: ['*'] }  // Deep query for user_id relationship
        ]
      };

      console.log('📋 AdoptionService.findOne - Query:', JSON.stringify(queryWithFields, null, 2));

      const result = await super.findOne(id, queryWithFields);
      
      console.log('✅ AdoptionService.findOne - Result:', JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
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

  async updateAdoptionStatus(id: string, status: 'pending' | 'confirming' | 'confirmed' | 'completed' | 'cancelled') {
    try {
      return await this.update(id, { status });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create adoption with validation to prevent multiple pending adoptions for same pet
   */
  async create(data: Partial<DirectusAdoption>) {
    try {
      // Check if pet is available
      const pet = await this.petService.findOne(data.pet_id!);
      if (!pet) {
        throw new AppError(404, 'fail', 'Pet not found');
      }

      if (pet.status !== 'available') {
        throw new AppError(400, 'fail', 'Pet is not available for adoption');
      }

      // Check for existing pending/confirming/confirmed adoptions for this pet
      const existingAdoptions = await this.findAll({
        filter: {
          _and: [
            { pet_id: { _eq: data.pet_id } },
            { 
              status: { 
                _in: ['pending', 'confirming', 'confirmed'] 
              } 
            }
          ]
        }
      });

      if (existingAdoptions && existingAdoptions.data && existingAdoptions.data.length > 0) {
        throw new AppError(409, 'fail', 'There is already a pending adoption for this pet');
      }

      // Create the adoption with default status 'pending'
      const adoption = await super.create({
        ...data,
        status: 'pending'
      });

      return adoption;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send confirmation request to user
   * Changes pet status to 'pending' and adoption status to 'confirming'
   */
  async sendConfirmationRequest(adoptionId: string) {
    try {
      // Get adoption details
      const adoption = await this.findOne(adoptionId);
      if (!adoption) {
        throw new AppError(404, 'fail', 'Adoption not found');
      }

      // Validate current status
      if (adoption.status !== 'pending') {
        throw new AppError(400, 'fail', 'Can only send confirmation for pending adoptions');
      }

      // Get pet and user IDs (they might be objects or strings)
      const petId = typeof adoption.pet_id === 'object' ? adoption.pet_id.id : adoption.pet_id;
      
      // Get directus user ID for notifications (user_id object contains directus_user_id)
      const directusUserId = typeof adoption.user_id === 'object' 
        ? adoption.user_id.directus_user_id 
        : null;
      
      if (!directusUserId) {
        throw new AppError(400, 'fail', 'User does not have a linked Directus account');
      }

      // Update pet status to 'pending'
      await this.petService.update(petId!, { status: 'pending' });

      // Set confirmation expiry (7 days)
      const confirmationExpiresAt = new Date();
      confirmationExpiresAt.setDate(confirmationExpiresAt.getDate() + 7);

      // Update adoption status to 'confirming'
      const updatedAdoption = await this.update(adoptionId, {
        status: 'confirming',
        confirmation_sent_at: new Date().toISOString(),
        confirmation_expires_at: confirmationExpiresAt.toISOString()
      });

      // Initialize subscriber and send confirmation email
      await this.notificationService.initializeSubscriber(directusUserId);
      await this.notificationService.sendAdoptionConfirmationEmail(
        adoptionId,
        directusUserId,
        petId!
      );

      return updatedAdoption;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * User confirms adoption
   * Changes adoption status to 'confirmed'
   */
  async confirmAdoption(adoptionId: string) {
    try {
      const adoption = await this.findOne(adoptionId);
      if (!adoption) {
        throw new AppError(404, 'fail', 'Adoption not found');
      }

      if (adoption.status !== 'confirming') {
        throw new AppError(400, 'fail', 'Can only confirm adoptions in confirming status');
      }

      // Check if confirmation has expired
      if (adoption.confirmation_expires_at && 
          new Date(adoption.confirmation_expires_at) < new Date()) {
        // Auto-cancel if expired
        return await this.cancelAdoption(adoptionId, true);
      }

      // Update adoption status to 'confirmed'
      return await this.update(adoptionId, {
        status: 'confirmed',
        approval_date: new Date().toISOString()
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel adoption
   * Changes adoption status to 'cancelled' and pet status back to 'available'
   */
  async cancelAdoption(adoptionId: string, isExpired: boolean = false) {
    try {
      const adoption = await this.findOne(adoptionId);
      if (!adoption) {
        throw new AppError(404, 'fail', 'Adoption not found');
      }

      // Get pet ID (might be object or string)
      const petId = typeof adoption.pet_id === 'object' ? adoption.pet_id.id : adoption.pet_id;

      // Update adoption status to 'cancelled'
      const updatedAdoption = await this.update(adoptionId, {
        status: 'cancelled',
        notes: isExpired 
          ? (adoption.notes || '') + '\n[Auto-cancelled due to confirmation timeout]'
          : adoption.notes
      });

      // Update pet status back to 'available'
      await this.petService.update(petId!, { status: 'available' });

      return updatedAdoption;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Complete adoption (after in-person appointment)
   * Changes adoption status to 'completed' and pet status to 'adopted'
   */
  async completeAdoption(adoptionId: string) {
    try {
      const adoption = await this.findOne(adoptionId);
      if (!adoption) {
        throw new AppError(404, 'fail', 'Adoption not found');
      }

      if (adoption.status !== 'confirmed') {
        throw new AppError(400, 'fail', 'Can only complete confirmed adoptions');
      }

      // Get pet ID (might be object or string)
      const petId = typeof adoption.pet_id === 'object' ? adoption.pet_id.id : adoption.pet_id;

      // Update pet status to 'adopted'
      await this.petService.update(petId!, { status: 'adopted' });

      // Update adoption status to 'completed'
      return await this.update(adoptionId, {
        status: 'completed'
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check and auto-cancel expired confirmations
   * Should be called periodically (e.g., via cron job)
   */
  async autoCancelExpiredConfirmations() {
    try {
      // Find adoptions in 'confirming' status with expired confirmation
      const expiredAdoptions = await this.findAll({
        filter: {
          _and: [
            { status: { _eq: 'confirming' } },
            { confirmation_expires_at: { _lt: new Date().toISOString() } }
          ]
        }
      });

      if (!expiredAdoptions || !expiredAdoptions.data) {
        return { cancelled: 0 };
      }

      const cancelledIds = [];
      for (const adoption of expiredAdoptions.data) {
        try {
          await this.cancelAdoption(adoption.id, true);
          cancelledIds.push(adoption.id);
        } catch (error) {
          console.error(`Failed to auto-cancel adoption ${adoption.id}:`, error);
        }
      }

      return { cancelled: cancelledIds.length, ids: cancelledIds };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendAppointmentEmail(adoptionId: string, userId: string, petId: string) {
    try {
      // Initialize the subscriber in Novu
      await this.notificationService.initializeSubscriber(userId);
      
      // Send the appointment email
      return await this.notificationService.sendAdoptionAppointmentEmail(adoptionId, userId, petId);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}