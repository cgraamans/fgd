import db from '../services/db';
import {T} from '../../types/index';
import { ResultSetHeader } from 'mysql2';

/**
 * Get a list of items from the database.
 * @param options - Options for filtering and limiting the results.
 * @returns A promise that resolves to an array of items.
 */

export const getItemList = (options:T.getItemOptions = {limit:10}) => {

  if(options.id) {
    return db.connection.query<T.Item[]>('SELECT * FROM items WHERE id = ?', [options.id]);
  }

  if(options.from) {
    return db.connection.query<ResultSetHeader>('SELECT * FROM items WHERE id < ? LIMIT ?', [options.from, options.limit]);
  }
  
  if(options.user) {
    return db.connection.query<T.Item[]>('SELECT * FROM items WHERE user = ? LIMIT ?', [options.user, options.limit]);
  }

  if(options.category) {
    return db.connection.query<T.Item[]>('SELECT * FROM items WHERE category = ? LIMIT ?', [options.category, options.limit]);
  }

  // Default case: return all items with a limit
  return db.connection.query<T.Item[]>('SELECT * FROM items LIMIT ?', [options.limit]);

};