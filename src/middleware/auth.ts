import { RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt';

export const authenticate: RequestHandler = (
    req,
    res,
    next
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7);
        const payload = verifyToken(token);

        req.user = {
            id: payload.userId,
            userId: payload.userId,
            role: payload.role
        };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const requireAdmin: RequestHandler = (
    req,
    res,
    next
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    if (req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    next();
};
