import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as paymentsController from '../controllers/payments.controller.js';

const router = express.Router();

router.get('/', authenticateToken, paymentsController.listPayments);
router.post('/', authenticateToken, paymentsController.createPayment);
router.get('/:paymentId', authenticateToken, paymentsController.getPayment);
router.post('/:paymentId/refunds', authenticateToken, paymentsController.refundPayment);

export default router;

