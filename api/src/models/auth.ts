import db from '../services/db';
import {T} from '../../types/index';
import { ResultSetHeader } from 'mysql2';

/**
 * Get a list of items from the database.
 * @param options - Options for filtering and limiting the results.
 * @returns A promise that resolves to an array of items.
 */

export const userExists = async (username: string): Promise<boolean> => {
  const [results] = await db.connection.query('SELECT COUNT(*) as count FROM users WHERE username = ?', [username]);
  if(Array.isArray(results) && results.length > 0) {
    return true;
  }
  return false;
};

export const getUserByUsername = async (username: string): Promise<T.User | null> => {
  const [results] = await db.connection.query('SELECT * FROM users WHERE username = ?', [username]); 
  if(Array.isArray(results) && results.length > 0) {
    // const roles = await db.connection.query
    const user = results[0] as T.User;
    return user;
  }
  return null;
};

export const isValidPassword = async (username:string, password: string): Promise<boolean> => {
  return false
};

// export const getUserByUsername = async (username: string): Promise<T.User | null> => {}

export const createUser = async (username: string, password: string): Promise<boolean> => {
  const [result] = await db.connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
  console.log(result);
  return false;
};
