import { Router } from 'express';
import petRoutes from './pet.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/pets', petRoutes);
router.use('/users', userRoutes);

// We'll add more routes here as we implement them:
// router.use('/adoptions', adoptionRoutes);
// router.use('/reports', reportRoutes);
// router.use('/rescues', rescueRoutes);

export default router;