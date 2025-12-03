import nodemailer from 'nodemailer';
import { adminDirectus } from '../config/directus';
import config from '../config';
import { DirectusNotification } from '../types/interfaces/notification.interface';
import { BaseService } from './base.service';
import { emailTemplates } from '../templates/email.templates';
import { PetService } from './pet.service';

export class NotificationService extends BaseService<DirectusNotification> {
  private transporter: nodemailer.Transporter;
  private petService: PetService;
  // Keep admin SDK for notifications since they need cross-user access
  // and system-level operations (creating notifications for other users)
  protected notificationSdk = adminDirectus;

  constructor() {
    super('notifications');
    this.petService = new PetService();

    // Create email transporter
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
      },
    });

    // Verify transporter configuration
    this.transporter.verify((error) => {
      if (error) {
        console.error('Email transporter configuration error:', error);
      } else {
        console.log('Email transporter is ready');
      }
    });
  }

  /**
   * Create a notification in Directus
   * Uses admin SDK to bypass permission checks
   * Prevents duplicate notifications by checking for recent similar notifications
   */
  async createNotification(data: Partial<DirectusNotification>) {
    try {
      const { createItem, readItems } = await import('@directus/sdk');
      
      // Convert app user ID to Directus user ID if needed
      let notificationData = { ...data };
      if (data.user_id) {
        const directusUserId = await this.getDirectusUserId(data.user_id);
        notificationData.user_id = directusUserId;
      }
      
      // Check for duplicate notifications created in the last 5 seconds
      // This prevents race conditions from creating duplicate notifications
      if (notificationData.user_id && notificationData.related_id && notificationData.type) {
        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
        
        const existingNotifications = await this.notificationSdk.request(readItems(this.collection, {
          filter: {
            user_id: { _eq: notificationData.user_id },
            related_id: { _eq: notificationData.related_id },
            type: { _eq: notificationData.type },
            date_created: { _gte: fiveSecondsAgo },
          },
          limit: 1,
        }));
        
        if (existingNotifications && existingNotifications.length > 0) {
          console.log('Duplicate notification prevented:', notificationData);
          return existingNotifications[0];
        }
      }
      
      return await this.notificationSdk.request(createItem(this.collection, notificationData));
    } catch (error) {
      console.error('Error creating notification:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get notifications for a user
   * Uses admin SDK to ensure access
   * Accepts either app user ID or directus user ID
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    try {
      const { readItems } = await import('@directus/sdk');
      
      // Convert to Directus user ID
      const directusUserId = await this.getDirectusUserId(userId);
      
      const filter: any = { user_id: { _eq: directusUserId } };
      
      if (unreadOnly) {
        filter.is_read = { _eq: false };
      }

      const items = await this.notificationSdk.request(readItems(this.collection, {
        filter,
        sort: ['-date_created'],
      }));

      return {
        data: Array.isArray(items) ? items : [],
        total: Array.isArray(items) ? items.length : 0,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a single notification by ID
   * Verifies that the notification belongs to the user
   */
  async getNotificationById(notificationId: string, userId: string) {
    try {
      const { readItem } = await import('@directus/sdk');
      
      // Get the notification
      const notification = await this.notificationSdk.request(readItem(this.collection, notificationId));
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      // Convert to Directus user ID for comparison
      const directusUserId = await this.getDirectusUserId(userId);
      
      // Verify ownership
      if (notification.user_id !== directusUserId) {
        throw new Error('Unauthorized access to notification');
      }

      return notification;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Mark notification as read
   * Uses admin SDK
   */
  async markAsRead(notificationId: string) {
    try {
      const { updateItem } = await import('@directus/sdk');
      return await this.notificationSdk.request(updateItem(this.collection, notificationId, {
        is_read: true,
        read_at: new Date().toISOString(),
      }));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    try {
      const notifications = await this.getUserNotifications(userId, true);
      
      if (!notifications.data || notifications.data.length === 0) {
        return { updated: 0 };
      }

      const updatePromises = notifications.data.map((notification) =>
        this.markAsRead(notification.id!)
      );

      await Promise.all(updatePromises);

      return { updated: notifications.data.length };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send email helper
   */
  private async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${config.email.from.name}" <${config.email.from.address}>`,
        to,
        subject,
        html,
      });

      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Get Directus user ID from app user ID
   * The notifications collection references directus_users, not the app users collection
   */
  private async getDirectusUserId(appUserId: string): Promise<string> {
    try {
      const { readItems } = await import('@directus/sdk');
      
      // Query the users collection to get the directus_user_id
      const users = await this.notificationSdk.request(readItems('users', {
        filter: { id: { _eq: appUserId } },
        fields: ['directus_user_id'],
        limit: 1,
      }));

      if (users && users.length > 0 && users[0].directus_user_id) {
        return users[0].directus_user_id;
      }

      // If not found in users collection, assume it's already a directus user ID
      return appUserId;
    } catch (error) {
      console.error('Error getting Directus user ID:', error);
      // Fallback to the provided ID
      return appUserId;
    }
  }

  /**
   * Get user details for notifications
   * Accepts app user ID and fetches from users collection
   */
  private async getUserDetails(userId: string) {
    try {
      const { readItems } = await import('@directus/sdk');
      
      // Query the users collection directly for app user data
      const users = await this.notificationSdk.request(readItems('users', {
        filter: { id: { _eq: userId } },
        fields: ['id', 'email', 'first_name', 'last_name', 'directus_user_id'],
        limit: 1,
      }));

      if (users && users.length > 0 && users[0].email) {
        return users[0];
      }
      
      // If not found in users collection, try as directus user ID
      const { readUser } = await import('@directus/sdk');
      const directusUser = await this.notificationSdk.request(readUser(userId));
      if (directusUser && directusUser.email) {
        return directusUser;
      }
      
      throw new Error('Không tìm thấy người dùng hoặc không có email');
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Return a default user object to prevent notification failures from breaking the main operation
      return {
        id: userId,
        email: 'noreply@shelter.com',
        first_name: 'User',
        last_name: '',
      };
    }
  }

  // ==================== ADOPTION NOTIFICATIONS ====================

  /**
   * Send adoption confirmation email
   */
  async sendAdoptionConfirmationEmail(adoptionId: string, userId: string, petId: string) {
    try {
      const user = await this.getUserDetails(userId);
      const pet = await this.petService.findOne(petId);

      if (!pet) {
        throw new Error('Pet not found');
      }

      const confirmUrl = `${config.frontend.url}/adoptions/confirm/${adoptionId}`;
      const cancelUrl = `${config.frontend.url}/adoptions/cancel/${adoptionId}`;

      const html = emailTemplates.adoptionConfirmation({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        petName: pet.name,
        petSpecies: pet.species,
        confirmUrl,
        cancelUrl,
        expiresIn: '7 days',
      });

      await this.sendEmail(
        user.email,
        'Adoption Confirmation Required',
        html
      );

      // Create in-app notification
      await this.createNotification({
        user_id: userId,
        title: 'Adoption Confirmation Required',
        message: `Please confirm your adoption request for ${pet.name} within 7 days.`,
        type: 'adoption',
        related_id: adoptionId,
        is_read: false,
      });

      return { success: true, message: 'Confirmation email sent successfully' };
    } catch (error: any) {
      console.error('Error sending adoption confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send adoption status update notification
   */
  async sendAdoptionStatusUpdate(
    adoptionId: string,
    userId: string,
    petId: string,
    status: string,
    customMessage?: string
  ) {
    try {
      const user = await this.getUserDetails(userId);
      const pet = await this.petService.findOne(petId);

      if (!pet) {
        throw new Error('Pet not found');
      }

      const statusMessages: Record<string, string> = {
        pending: 'Your adoption request is being reviewed by our team.',
        confirming: 'Please check your email to confirm your adoption request.',
        confirmed: 'Great news! Your adoption has been confirmed. We will contact you soon to schedule a meeting.',
        completed: `Congratulations! You have successfully adopted ${pet.name}. Thank you for giving a pet a loving home!`,
        cancelled: 'Your adoption request has been cancelled.',
      };

      const message = customMessage || statusMessages[status] || 'Your adoption status has been updated.';
      const detailsUrl = `${config.frontend.url}/adoptions/show/${adoptionId}`;

      const html = emailTemplates.adoptionStatusUpdate({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        petName: pet.name,
        status,
        message,
        detailsUrl,
      });

      await this.sendEmail(
        user.email,
        `Adoption Status Update: ${status}`,
        html
      );

      // Create in-app notification
      await this.createNotification({
        user_id: userId,
        title: `Adoption Status: ${status}`,
        message: `Your adoption request for ${pet.name} is now ${status}. ${message}`,
        type: 'adoption',
        related_id: adoptionId,
        is_read: false,
      });

      return { success: true, message: 'Status update sent successfully' };
    } catch (error) {
      console.error('Error sending adoption status update:', error);
      throw error;
    }
  }

  // ==================== RESCUE NOTIFICATIONS ====================

  /**
   * Send rescue status update notification
   */
  async sendRescueStatusUpdate(
    rescueId: string,
    userId: string,
    status: string,
    customMessage?: string
  ) {
    try {
      const user = await this.getUserDetails(userId);

      const statusMessages: Record<string, string> = {
        pending: 'Your rescue request has been received and is under review.',
        assigned: 'A rescue team has been assigned to your case.',
        in_progress: 'The rescue team is on their way to the location.',
        completed: 'The rescue mission has been completed successfully. Thank you for reporting!',
        cancelled: 'The rescue mission has been cancelled.',
      };

      const message = customMessage || statusMessages[status] || 'Your rescue status has been updated.';
      const detailsUrl = `${config.frontend.url}/rescues/show/${rescueId}`;

      const html = emailTemplates.rescueStatusUpdate({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        rescueId,
        status,
        message,
        detailsUrl,
      });

      await this.sendEmail(
        user.email,
        `Rescue Mission Update: ${status}`,
        html
      );

      // Create in-app notification
      await this.createNotification({
        user_id: userId,
        title: `Rescue Status: ${status}`,
        message: `Rescue mission #${rescueId} is now ${status}. ${message}`,
        type: 'rescue',
        related_id: rescueId,
        is_read: false,
      });

      return { success: true, message: 'Rescue status update sent successfully' };
    } catch (error) {
      console.error('Error sending rescue status update:', error);
      throw error;
    }
  }

  /**
   * Send rescue assignment notification to rescuer
   */
  async sendRescueAssignmentNotification(
    rescueId: string,
    rescuerId: string,
    location: string,
    description: string
  ) {
    try {
      const user = await this.getUserDetails(rescuerId);
      const detailsUrl = `${config.frontend.url}/rescues/show/${rescueId}`;

      const html = emailTemplates.rescueAssignment({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        rescueId,
        location,
        description,
        detailsUrl,
      });

      await this.sendEmail(
        user.email,
        'New Rescue Assignment',
        html
      );

      // Create in-app notification
      await this.createNotification({
        user_id: rescuerId,
        title: 'New Rescue Assignment',
        message: `You have been assigned to rescue mission #${rescueId} at ${location}.`,
        type: 'rescue',
        related_id: rescueId,
        is_read: false,
      });

      return { success: true, message: 'Assignment notification sent successfully' };
    } catch (error) {
      console.error('Error sending rescue assignment notification:', error);
      throw error;
    }
  }

  // ==================== REPORT NOTIFICATIONS ====================

  /**
   * Send report status update notification
   */
  async sendReportStatusUpdate(
    reportId: string,
    userId: string,
    status: string,
    customMessage?: string
  ) {
    try {
      const user = await this.getUserDetails(userId);

      const statusMessages: Record<string, string> = {
        pending: 'Your report has been received and is under review.',
        investigating: 'We are investigating your report.',
        resolved: 'Your report has been resolved. Thank you for caring about animal welfare!',
        rejected: 'Your report has been reviewed and closed.',
      };

      const message = customMessage || statusMessages[status] || 'Your report status has been updated.';
      const detailsUrl = `${config.frontend.url}/reports/show/${reportId}`;

      const html = emailTemplates.reportStatusUpdate({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        reportId,
        status,
        message,
        detailsUrl,
      });

      await this.sendEmail(
        user.email,
        `Report Update: ${status}`,
        html
      );

      // Create in-app notification
      await this.createNotification({
        user_id: userId,
        title: `Report Status: ${status}`,
        message: `Your report #${reportId} is now ${status}. ${message}`,
        type: 'report',
        related_id: reportId,
        is_read: false,
      });

      return { success: true, message: 'Report status update sent successfully' };
    } catch (error) {
      console.error('Error sending report status update:', error);
      throw error;
    }
  }

  // ==================== SYSTEM NOTIFICATIONS ====================

  /**
   * Get all admin users for system notifications
   */
  private async getAdminUsers(): Promise<any[]> {
    try {
      const { readItems } = await import('@directus/sdk');
      
      // Get users with admin role (role = 'Admin')
      const adminUsers = await this.notificationSdk.request(readItems('users', {
        filter: {
          role: { _eq: 'Admin' }
        },
        fields: ['id', 'email', 'first_name', 'last_name', 'directus_user_id'],
      }));
      
      return adminUsers || [];
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  }

  /**
   * Notify all admins about new user registration
   */
  async notifyAdminsNewUserRegistered(
    newUserId: string,
    userName: string,
    userEmail: string
  ) {
    try {
      const admins = await this.getAdminUsers();
      
      if (admins.length === 0) {
        console.warn('No admin users found to notify');
        return { success: false, message: 'No admin users found' };
      }

      const detailsUrl = `${config.frontend.url}/users/show/${newUserId}`;

      // Send notification to each admin
      for (const admin of admins) {
        if (!admin.directus_user_id) continue;

        // Send email
        const html = emailTemplates.generic({
          title: 'New User Registered',
          greeting: `Hello ${admin.first_name || 'Admin'},`,
          message: `A new user has registered on the platform.`,
          details: [
            `<strong>Name:</strong> ${userName}`,
            `<strong>Email:</strong> ${userEmail}`,
            `<strong>Registration Date:</strong> ${new Date().toLocaleString()}`,
          ],
          actionUrl: detailsUrl,
          actionText: 'View User Profile',
        });

        await this.sendEmail(
          admin.email,
          'New User Registration',
          html
        );

        // Create in-app notification
        await this.createNotification({
          user_id: admin.directus_user_id,
          title: 'New User Registered',
          message: `${userName} (${userEmail}) has joined the platform.`,
          type: 'system',
          related_id: newUserId,
          is_read: false,
        });
      }

      return { success: true, message: `Notified ${admins.length} admin(s)` };
    } catch (error) {
      console.error('Error notifying admins about new user:', error);
      throw error;
    }
  }

  /**
   * Notify all admins about new report posted
   */
  async notifyAdminsNewReportPosted(
    reportId: string,
    reportType: string,
    urgencyLevel: string,
    location: string,
    reporterName: string
  ) {
    try {
      const admins = await this.getAdminUsers();
      
      if (admins.length === 0) {
        console.warn('No admin users found to notify');
        return { success: false, message: 'No admin users found' };
      }

      const detailsUrl = `${config.frontend.url}/reports/show/${reportId}`;
      const urgencyEmoji = urgencyLevel === 'critical' ? '🚨' : urgencyLevel === 'high' ? '⚠️' : 'ℹ️';

      // Send notification to each admin
      for (const admin of admins) {
        if (!admin.directus_user_id) continue;

        // Send email
        const html = emailTemplates.generic({
          title: 'New Report Posted',
          greeting: `Hello ${admin.first_name || 'Admin'},`,
          message: `A new ${reportType} report has been posted and requires attention.`,
          details: [
            `<strong>Type:</strong> ${reportType}`,
            `<strong>Urgency Level:</strong> ${urgencyEmoji} ${urgencyLevel.toUpperCase()}`,
            `<strong>Location:</strong> ${location}`,
            `<strong>Reported By:</strong> ${reporterName}`,
            `<strong>Report Date:</strong> ${new Date().toLocaleString()}`,
          ],
          actionUrl: detailsUrl,
          actionText: 'View Report Details',
        });

        await this.sendEmail(
          admin.email,
          `New ${urgencyLevel.toUpperCase()} Report: ${reportType}`,
          html
        );

        // Create in-app notification
        await this.createNotification({
          user_id: admin.directus_user_id,
          title: `New ${urgencyLevel.toUpperCase()} Report`,
          message: `${urgencyEmoji} ${reportType} report at ${location} by ${reporterName}`,
          type: 'system',
          related_id: reportId,
          is_read: false,
        });
      }

      return { success: true, message: `Notified ${admins.length} admin(s)` };
    } catch (error) {
      console.error('Error notifying admins about new report:', error);
      throw error;
    }
  }

  /**
   * Notify all admins about new adoption request
   */
  async notifyAdminsNewAdoptionRequest(
    adoptionId: string,
    petName: string,
    petSpecies: string,
    adopterName: string,
    adopterEmail: string
  ) {
    try {
      const admins = await this.getAdminUsers();
      
      if (admins.length === 0) {
        console.warn('No admin users found to notify');
        return { success: false, message: 'No admin users found' };
      }

      const detailsUrl = `${config.frontend.url}/adoptions/show/${adoptionId}`;

      // Send notification to each admin
      for (const admin of admins) {
        if (!admin.directus_user_id) continue;

        // Send email
        const html = emailTemplates.generic({
          title: 'New Adoption Request',
          greeting: `Hello ${admin.first_name || 'Admin'},`,
          message: `A new adoption request has been submitted and is awaiting review.`,
          details: [
            `<strong>Pet:</strong> ${petName} (${petSpecies})`,
            `<strong>Adopter Name:</strong> ${adopterName}`,
            `<strong>Adopter Email:</strong> ${adopterEmail}`,
            `<strong>Request Date:</strong> ${new Date().toLocaleString()}`,
          ],
          actionUrl: detailsUrl,
          actionText: 'Review Adoption Request',
        });

        await this.sendEmail(
          admin.email,
          'New Adoption Request Pending',
          html
        );

        // Create in-app notification
        await this.createNotification({
          user_id: admin.directus_user_id,
          title: 'New Adoption Request',
          message: `${adopterName} wants to adopt ${petName} (${petSpecies})`,
          type: 'system',
          related_id: adoptionId,
          is_read: false,
        });
      }

      return { success: true, message: `Notified ${admins.length} admin(s)` };
    } catch (error) {
      console.error('Error notifying admins about new adoption:', error);
      throw error;
    }
  }

  /**
   * Notify all admins when a user claims a report (creates a rescue)
   */
  async notifyAdminsReportClaimed(
    rescueId: string,
    reportId: string,
    claimerName: string,
    location: string,
    reportType: string
  ) {
    try {
      const admins = await this.getAdminUsers();
      
      if (admins.length === 0) {
        console.warn('No admin users found to notify');
        return { success: false, message: 'No admin users found' };
      }

      const rescueUrl = `${config.frontend.url}/rescues/show/${rescueId}`;
      const reportUrl = `${config.frontend.url}/reports/show/${reportId}`;

      // Send notification to each admin
      for (const admin of admins) {
        if (!admin.directus_user_id) continue;

        // Send email
        const html = emailTemplates.generic({
          title: 'Report Claimed for Rescue',
          greeting: `Hello ${admin.first_name || 'Admin'},`,
          message: `A user has claimed a report and initiated a rescue mission.`,
          details: [
            `<strong>Claimed By:</strong> ${claimerName}`,
            `<strong>Report Type:</strong> ${reportType}`,
            `<strong>Location:</strong> ${location}`,
            `<strong>Rescue ID:</strong> #${rescueId}`,
            `<strong>Original Report:</strong> <a href="${reportUrl}">#${reportId}</a>`,
            `<strong>Claim Date:</strong> ${new Date().toLocaleString()}`,
          ],
          actionUrl: rescueUrl,
          actionText: 'View Rescue Mission',
        });

        await this.sendEmail(
          admin.email,
          'Report Claimed - Rescue Mission Started',
          html
        );

        // Create in-app notification
        await this.createNotification({
          user_id: admin.directus_user_id,
          title: 'Report Claimed',
          message: `${claimerName} claimed ${reportType} report at ${location}`,
          type: 'system',
          related_id: rescueId,
          is_read: false,
        });
      }

      return { success: true, message: `Notified ${admins.length} admin(s)` };
    } catch (error) {
      console.error('Error notifying admins about report claim:', error);
      throw error;
    }
  }
}
