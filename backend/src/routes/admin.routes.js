//admin.routes.js

import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { requirePropertyCompliance } from '../middleware/compliance.js';
import * as adminController from '../controllers/admin.controller.js';
import { getAdminSummary } from '../controllers/adminSummary.controller.js';

const router = express.Router();

// GLOBAL MIDDLEWARE (applies to all admin routes)
router.use(authenticateToken);
router.use(requireAdmin);

//✈ FLIGHTS CRUD (MongoDB)
router.post(
  '/flights',
  requirePropertyCompliance,
  adminController.createFlight
);

router.patch(
  '/flights/:flightId',
  requirePropertyCompliance,
  adminController.updateFlight
);

router.delete(
  '/flights/:flightId',
  requirePropertyCompliance,
  adminController.deleteFlight
);

// 🏨 HOTELS CRUD (MongoDB)/
router.post(
  '/hotels',
  requirePropertyCompliance,
  adminController.createHotel
);

router.patch(
  '/hotels/:hotelId',
  requirePropertyCompliance,
  adminController.updateHotel
);

router.delete(
  '/hotels/:hotelId',
  requirePropertyCompliance,
  adminController.deleteHotel
);

// 🚗 CARS CRUD (MongoDB)

router.post(
  '/cars',
  requirePropertyCompliance,
  adminController.createCar
);

router.patch(
  '/cars/:carId',
  requirePropertyCompliance,
  adminController.updateCar
);

router.delete(
  '/cars/:carId',
  requirePropertyCompliance,
  adminController.deleteCar
);


//👤 USER MANAGEMENT
   
router.patch('/users/:userId', adminController.modifyUser);

//📈 ADMIN SUMMARY DASHBOARD

router.get('/summary', getAdminSummary);

// 📊 ANALYTICS & REPORTS

router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/providers', adminController.getTopProviders);

export default router;