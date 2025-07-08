import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function jwtGuard(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = (req.headers.authorization ?? '').split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      (req as any).user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
