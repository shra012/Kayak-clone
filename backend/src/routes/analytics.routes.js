import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as analyticsController from '../controllers/analytics.controller.js';

const router = express.Router();

router.get('/traces/users', authenticateToken, analyticsController.getUserTraces);

export default router;

