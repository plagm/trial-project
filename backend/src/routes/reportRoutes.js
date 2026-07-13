import express from 'express';
import { generateFinancialReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/ai-insights', protect, generateFinancialReport);

export default router;
