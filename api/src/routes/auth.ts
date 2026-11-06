import { Router } from 'express';
import { register, login, isUser } from '../controllers/auth';

// Create a new router instance 

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/isUser', isUser);

export default router;
