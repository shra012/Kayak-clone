import express from 'express';
import * as listingsController from '../controllers/listings.controller.js';

const router = express.Router();

router.get('/search', listingsController.searchFlights);
router.get('/:flightId', listingsController.getFlight);

router.get('/search', listingsController.searchHotels);
router.get('/:hotelId', listingsController.getHotel);

router.get('/search', listingsController.searchCars);
router.get('/:carId', listingsController.getCar);

export default router;

