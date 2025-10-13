import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  directus: {
    url: process.env.DIRECTUS_URL,
    email: process.env.DIRECTUS_EMAIL,
    password: process.env.DIRECTUS_PASSWORD,
    static: process.env.DIRECTUS_STATIC,
    token: process.env.DIRECTUS_TOKEN,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};

export default config;