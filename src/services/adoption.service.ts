import { BaseService } from './base.service';
import { DirectusAdoption } from '../types/directus';
import { NotificationService } from './notification.service';

export class AdoptionService extends BaseService<DirectusAdoption> {
  private notificationService: NotificationService;

  constructor() {
    super('adoptions');
    this.notificationService = new NotificationService();
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

  async updateAdoptionStatus(id: string, status: | 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    try {
      return await this.update(id, { status });
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