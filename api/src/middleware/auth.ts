import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {T} from '../../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Get items based on provided options.
 * @param req - The request object containing query parameters.
 * @param res - The response object to send the results.
 * @param next - The next middleware function in the stack.
 */

export const verifyAuthToken = (req: Request, res: Response, next: NextFunction) => {

    const token = req.cookies.token;
    if (!token) return res.status(403).json({ message: 'Token is missing.' });

    try {

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded as T.User;

        next();

    } catch (err) {

        res.status(401).json({ message: 'Invalid token.' });

    }

};