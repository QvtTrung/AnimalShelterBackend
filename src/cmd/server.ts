import express, { Application } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import config from '../config';
import authRoutes from '../routes/auth.routes';
import petRoutes from '../routes/pet.routes';
import adoptionRoutes from '../routes/adoption.routes';
import reportRoutes from '../routes/report.routes';
import rescueRoutes from '../routes/rescue.routes';
import userRoutes from '../routes/user.routes';
import { errorHandler } from '../middleware/error.middleware';
import { corsMiddleware } from '../middleware/cors.middleware';

// Create Express application
const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(helmet());

// Use custom CORS middleware
app.use(corsMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/rescues', rescueRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;