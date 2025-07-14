import { Router } from 'express';
import {
  getItems,
} from '../controllers/items';

// Create a new router instance 

const router = Router();

router.get('/items/', getItems);
router.get('/items/:options', getItems);

export default router;

module.exports = router;
