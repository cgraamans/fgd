import { Request, Response, NextFunction } from 'express';
import { getItemList } from '../models/items';

/**
 * Get items based on provided options.
 * @param req - The request object containing query parameters.
 * @param res - The response object to send the results.
 * @param next - The next middleware function in the stack.
 */

// Read all items
export const getItems = async (req: Request, res: Response, next: NextFunction) => {

  try {

    console.log('Fetching items with options:', req.params.options);

    // If no options are provided, default to an empty object with a limit of 10
    if(!req.params.options) {
      req.params.options = JSON.stringify({limit: 10});
    }

    // // Ensure options is an object
    // if(typeof req.params.options !== 'object' || Array.isArray(req.params.options)) {
    //   throw new Error('Invalid options format. Expected an object.');
    // }

    let options = JSON.parse(req.params.options);

    console.log('Parsed options:', options);

    // Validate options 
    if(options.id && typeof options.id !== 'number') {
      throw new Error('Invalid id format. Expected a number.');
    }

    if(options.user && typeof options.user !== 'string') {
      throw new Error('Invalid user format. Expected a string.');
    }
  
    if(options.category && typeof options.category !== 'number') {
      throw new Error('Invalid category format. Expected a number.');
    }

      // Validate options
    if(!options.limit || options.limit < 1) {
      options.limit = 10; // Default limit
    }
    if(options.limit > 100) {
      options.limit = 100; // Cap limit to prevent overload
    }
    if(options.from && options.from < 0) {
      options.from = 0; // Ensure 'from' is not negative
    }

    const items = await getItemList(options);

    console.log('Items fetched:', items);

    // Fetch the item list based on the provided options
    res.status(200).json(items);

  } catch (error) {
    
    next(error);
  
  }

};

