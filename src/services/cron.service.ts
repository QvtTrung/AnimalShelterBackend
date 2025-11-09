import cron from 'node-cron';
import { AdoptionService } from './adoption.service';
import { logger } from '../utils/logger';

export class CronService {
  private adoptionService: AdoptionService;

  constructor() {
    this.adoptionService = new AdoptionService();
  }

  /**
   * Start all cron jobs
   */
  startCronJobs() {
    // Run auto-cancel expired confirmations every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('🕐 Running auto-cancel expired confirmations cron job...');
        const result = await this.adoptionService.autoCancelExpiredConfirmations();
        logger.info(`✅ Auto-cancel completed: ${result.cancelled} adoptions cancelled`, result);
      } catch (error) {
        logger.error('❌ Error in auto-cancel cron job:', error);
      }
    });

    // Optional: Run every hour for more frequent checks (uncomment if needed)
    // cron.schedule('0 * * * *', async () => {
    //   try {
    //     logger.info('🕐 Running hourly auto-cancel check...');
    //     const result = await this.adoptionService.autoCancelExpiredConfirmations();
    //     if (result.cancelled > 0) {
    //       logger.info(`✅ Auto-cancel completed: ${result.cancelled} adoptions cancelled`, result);
    //     }
    //   } catch (error) {
    //     logger.error('❌ Error in auto-cancel cron job:', error);
    //   }
    // });

    logger.info('✅ Cron jobs started successfully');
  }

  /**
   * Stop all cron jobs
   */
  stopCronJobs() {
    cron.getTasks().forEach((task) => task.stop());
    logger.info('🛑 All cron jobs stopped');
  }
}
