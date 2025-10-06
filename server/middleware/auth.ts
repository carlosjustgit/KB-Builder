import { Request, Response, NextFunction } from 'express';

/**
 * Simple authentication middleware
 * For now, we'll allow all requests
 * In production, this would validate JWT tokens or session cookies
 */
export function authenticateRequest(_req: Request, _res: Response, next: NextFunction) {
  // For development, we'll skip authentication
  // In production, you would validate the user's session/token here
  next();
}
