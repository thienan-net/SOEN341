import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import * as express from 'express';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('authenticate error:', error);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.warn('authorize deny:', {
        userId: req.user._id?.toString(),
        role: req.user.role,
        requiredRoles: roles
      });
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

export const requireApproval = async (
    req: AuthRequest,
    res: express.Response,
    next: express.NextFunction
) => {
  try {
    console.log('requireApproval check:', {
      userId: req.user?._id?.toString(),
      role: req.user?.role,
      organizerStatus: req.user?.organizerStatus
    });

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Étudiants et admins passent sans contrainte d’approbation
    if (req.user.role === 'student' || req.user.role === 'admin') {
      return next();
    }

    // Les organisateurs doivent être approuvés
    if (req.user.role === 'organizer' && req.user.organizerStatus !== 'approved') {
      return res.status(403).json({ message: 'Organizer account not approved' });
    }

    return next();
  } catch (error) {
    console.error('requireApproval error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
