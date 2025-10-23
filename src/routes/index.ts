import { Router } from 'express';
import petRoutes from './pet.routes';
import userRoutes from './user.routes';
import adoptionRoutes from './adoption.routes';
import reportRoutes from './report.routes';
import rescueRoutes from './rescue.routes';

const router = Router();

router.use('/pets', petRoutes);
router.use('/users', userRoutes);
router.use('/adoptions', adoptionRoutes);
router.use('/reports', reportRoutes);
router.use('/rescues', rescueRoutes);

export default router;