import { Router } from 'express';
import { getItems } from '../controllers/items';

// Create a new router instance 

const router = Router();

router.get('/', getItems);
router.get('/:options', getItems);

export default router;
