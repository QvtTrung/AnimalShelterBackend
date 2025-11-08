import novu from '../config/novu';
import { PetService } from './pet.service';
import { UserService } from './user.service';

export class NotificationService {
  private petService: PetService;
  private userService: UserService;

  constructor() {
    this.petService = new PetService();
    this.userService = new UserService();
  }

  async sendAdoptionAppointmentEmail(adoptionId: string, userId: string, petId: string) {
  try {
    const user = await this.userService.findOne(userId);
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
      rescheduleUrl: `/adoption/${adoptionId}/reschedule`,
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
    const user = await this.userService.findOne(userId);
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
