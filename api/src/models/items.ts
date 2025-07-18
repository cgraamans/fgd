import db from '../services/db';
import {T} from '../../types/index';
import { ResultSetHeader } from 'mysql2';

/**
 * Get a list of items from the database.
 * @param options - Options for filtering and limiting the results.
 * @returns A promise that resolves to an array of items.
 */

export const getItemList = async (options:T.getItemOptions = {limit:10,dir:"desc"}): Promise<T.Item[]> => {

  let dir = options.dir || 'desc';
  if(dir !== 'asc' && dir !== 'desc') {
    dir = 'desc'; // Default to descending if invalid
  }

  let sql = `SELECT * FROM items ORDER BY id ${dir} LIMIT ? `;
  let params: any[] = [options.limit];

  if(options.id) {
    sql = `SELECT * FROM items WHERE id = ?`;
    params = [options.id];
  }

  if(options.from) {
    sql = `SELECT * FROM items WHERE id < ? ORDER BY id ${dir} LIMIT ?`;
    params = [options.from, options.limit];
  }
  
  if(options.user) {
    sql = `SELECT * FROM items WHERE user = ? ORDER BY id ${dir} LIMIT ?`;
    params = [options.user, options.limit];
  }

  if(options.category) {
    sql = `SELECT * FROM items WHERE category_id = ? ORDER BY ${dir} ? LIMIT ?`;
    params = [options.category, options.limit];
  }

  // Default case: return all items with a limit
  let [results] = await db.connection.query<T.Item[]>(sql, params);

  for(const item of results) {

    const [category] = await db.connection.query<T.ItemCategory[]>('SELECT * FROM i_categories WHERE id = ?', [item.category_id]);
    if(category.length > 0) {
      item.category = category[0];
    }

    const [itemLinks] = await db.connection.query<T.ItemLink[]>('SELECT * FROM i_links WHERE item_id = ?', [item.id]);
    for(const link of itemLinks) {
      const [metadata] = await db.connection.query<T.ItemMetadata[]>('SELECT * FROM i_metadata WHERE link_id = ?', [link.id]);
      if(metadata.length > 0) { 
        link.metadata = metadata[0];
      }
    }
    item.links = itemLinks;

  }

  // console.log(results);

  return results;

};