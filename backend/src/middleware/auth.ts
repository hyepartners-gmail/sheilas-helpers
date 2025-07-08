import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function jwtGuard(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = (req.headers.authorization ?? '').split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token' });
      return;                              // <- explicit return
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (roles.length && !roles.includes(payload.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;                            // <- explicit return
      }

      (req as any).user = payload;
      next();
      return;                              // <- satisfies “all code paths”
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;                              // <- explicit return in catch
    }
  };
}
