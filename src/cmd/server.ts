import express, { Application } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import config from '../config';
import authRoutes from '../routes/auth.routes';
import routes from '../routes/index';
import { errorHandler } from '../middleware/error.middleware';
import { corsMiddleware } from '../middleware/cors.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { CronService } from '../services/cron.service';

// Create Express application
const app: Application = express();

// Initialize Cron Service
const cronService = new CronService();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(helmet());

// Use custom CORS middleware
app.use(corsMiddleware);

// Use auth middleware to extract and set token for all requests
app.use(authMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start cron jobs after server starts
  cronService.startCronJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  cronService.stopCronJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  cronService.stopCronJobs();
  process.exit(0);
});

export default app;