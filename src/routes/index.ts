import { Router } from 'express';
import petRoutes from './pet.routes';
import userRoutes from './user.routes';
import adoptionRoutes from './adoption.routes';
import reportRoutes from './report.routes';
import rescueRoutes from './rescue.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import chatbotRoutes from './chatbot.routes';
import activityLogRoutes from './activity-log.routes';

const router = Router();

router.use('/pets', petRoutes);
router.use('/users', userRoutes);
router.use('/adoptions', adoptionRoutes);
router.use('/reports', reportRoutes);
router.use('/rescues', rescueRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/activities', activityLogRoutes);

export default router;