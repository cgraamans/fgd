import { Request, Response, NextFunction } from 'express';
import { getItemList } from '../models/items';
import { userExists, createUser, isValidPassword, getUserByUsername } from '../models/auth';
import bcrypt from 'bcrypt';
import { get } from 'http';
import jwt from 'jsonwebtoken';

/**
 * Get items based on provided options.
 * @param req - The request object containing query parameters.
 * @param res - The response object to send the results.
 * @param next - The next middleware function in the stack.
 */

export const register = async (req: Request, res: Response, next: NextFunction) => {

  try {

    const { name, password } = req.body;

    if(await userExists(name)) {
        return res.status(400).json({ message: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if(await createUser(name, hashedPassword)) {
      
      

    }

    return res.status(500).json({message: 'Something went wrong in DB execution'});
    // next();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }

};

export const login = async (req: Request, res: Response, next: NextFunction) => {

  try {

    const { name, password } = req.body;
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';


    if(!await userExists(name)) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = await getUserByUsername(name);
    if(!user) {
        return res.status(500).json({ message: 'Server error' });
    }

    // CHECK IF INPUT PASSWORD IS VALID FOR INPUT EMAIL
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // CREATE THE JWT TOKEN
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    // SET THE JWT TOKEN IN THE COOKIE
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 HR EXPIRATION
    });

    // Login logic goes here
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }

};

export const isUser = async (req: Request, res: Response, next: NextFunction) => {};