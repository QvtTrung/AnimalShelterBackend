import { Request, Response, NextFunction } from 'express';
import { directus } from '../config/directus';

/**
 * Middleware to extract the Bearer token from Authorization header
 * and set it in the Directus client for authenticated requests
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Set the token in the Directus client
      // This ensures that all Directus SDK calls in this request will use this token
      directus.setToken(token);
    } else {
      // IMPORTANT: Clear token if no auth header is present
      // This prevents token from previous request persisting in the singleton
      directus.setToken(null);
    }
    
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    directus.setToken(null); // Clear token on error
    next();
  }
}

/**
 * Middleware to require authentication
 * Use this for routes that require a valid token
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
      data: null
    });
    return;
  }
  
  const token = authHeader.substring(7);
  directus.setToken(token);
  
  next();
}
