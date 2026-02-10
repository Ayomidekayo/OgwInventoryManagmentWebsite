import express from 'express';
import { getMe, login, register } from '../controller/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get("/me", protect, getMe);

export default router;
