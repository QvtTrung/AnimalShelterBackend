import novu from '../config/novu';
import { PetService } from './pet.service';
import { directus } from '../config/directus';
import { readUser } from '@directus/sdk';

export class NotificationService {
  private petService: PetService;
  private baseUrl: string;

  constructor() {
    this.petService = new PetService();
    // Use frontend URL from environment or default
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  async sendAdoptionConfirmationEmail(adoptionId: string, userId: string, petId: string) {
    try {
      // Fetch Directus user directly
      const user = await directus.request(readUser(userId));
      if (!user || !user.email) {
        throw new Error('User not found or has no email');
      }

      const pet = await this.petService.findOne(petId);
      if (!pet) {
        throw new Error('Pet not found');
      }

      // Generate confirmation links
      const confirmUrl = `${this.baseUrl}/adoptions/confirm/${adoptionId}`;
      const cancelUrl = `${this.baseUrl}/adoptions/cancel/${adoptionId}`;

      console.log('Sending Novu notification with:', {
        workflowId: 'adoption-confirmation',
        subscriberId: userId,
        email: user.email,
        petName: pet.name,
      });

      await novu.trigger({
        workflowId: 'adoption-confirmation',
        to: {
          subscriberId: userId,
          email: user.email,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
        },
        payload: {
          petName: pet.name,
          petSpecies: pet.species,
          confirmUrl: confirmUrl,
          cancelUrl: cancelUrl,
          expiresIn: '7 days',
        },
      });

      console.log('Novu notification sent successfully');
      return { success: true, message: 'Confirmation email sent successfully' };
    } catch (error: any) {
      console.error('Error sending adoption confirmation email:', error);
      
      // Check if it's a Novu workflow error
      if (error?.message?.includes('workflow_not_found') || error?.rawValue?.message === 'workflow_not_found') {
        throw new Error('Email workflow not configured in Novu. Please create a workflow with ID "adoption-confirmation" in your Novu dashboard.');
      }
      
      throw error;
    }
  }

  async sendAdoptionAppointmentEmail(adoptionId: string, userId: string, petId: string) {
    try {
      // Fetch Directus user directly
      const user = await directus.request(readUser(userId));
      if (!user || !user.email) {
        throw new Error('User not found or has no email');
      }

      const pet = await this.petService.findOne(petId);
      if (!pet) {
        throw new Error('Pet not found');
      }

      await novu.trigger({
        workflowId: 'adoption-appointment',
        to: {
          subscriberId: userId,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        payload: {
          petName: pet.name,
          appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          detailsUrl: `${this.baseUrl}/adoptions/show/${adoptionId}`,
        },
      });

      return { success: true, message: 'Appointment email sent successfully' };
    } catch (error) {
      console.error('Error sending adoption appointment email:', error);
      throw error;
    }
  }

  async initializeSubscriber(userId: string) {
    try {
      const user = await directus.request(readUser(userId));
      if (!user || !user.email) {
        throw new Error('User not found or has no email');
      }

      await novu.subscribers.create({
        subscriberId: userId,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      });

      return { success: true, message: 'Subscriber initialized successfully' };
    } catch (error) {
      console.error('Error initializing subscriber:', error);
      throw error;
    }
  }
}
