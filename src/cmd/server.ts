import express, { Application } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import config from '../config';
import authRoutes from '../routes/auth.routes';
import routes from '../routes/index';
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
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;