import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: any;
  pbacContext?: {
    activeProjectId?: string;
    simulatedRole?: string;
  };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionUserId = req.headers['x-user-session'] as string;
    
    if (!sessionUserId) {
      return res.status(401).json({ error: 'Unauthorized: Missing x-user-session header' });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session user' });
    }

    req.user = user;
    req.pbacContext = {
      activeProjectId: req.headers['x-active-project-id'] as string,
      simulatedRole: req.headers['x-simulated-role'] as string,
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
};
