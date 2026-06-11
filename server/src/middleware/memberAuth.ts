import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface MemberAuthPayload {
  id: number;
  email: string;
  name: string;
  membership_number: string;
  role: 'member';
}

declare global {
  namespace Express {
    interface Request {
      member?: MemberAuthPayload;
    }
  }
}

export function requireMemberAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const payload = jwt.verify(token, secret) as MemberAuthPayload & { role?: string };

    if (payload.role !== 'member') {
      return res.status(403).json({ error: 'Member access required' });
    }

    req.member = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
