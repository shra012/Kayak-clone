import { logger } from '../config/logger.js';
import Flight from '../models/Flight.js';
import Hotel from '../models/Hotel.js';
import Car from '../models/Car.js';
import User from '../models/User.js';
import Bill from '../models/Bill.js';
import Booking from '../models/Booking.js';
import mongoose from 'mongoose';
import db from '../config/mysql.js';  // MySQL connection for billing

//validation

const validateRequired = (obj, fields) => {
  for (let f of fields) {
    if (!obj[f]) return `Missing required field: ${f}`;
  }
  return null;
};



// FLIGHT 
 
// CREATE FLIGHT
export const createFlight = async (req, res, next) => {
  try {
    const required = [
      "flightId", "airline", "departureAirport", "arrivalAirport",
      "departureDate", "arrivalDate", "duration", "flightClass",
      "ticketPrice", "totalSeats"
    ];

    const missing = validateRequired(req.body, required);
    if (missing) return res.status(400).json({ error: missing });

    const flight = await Flight.create(req.body);

    logger.info(`Flight created: ${flight.flightId}`);

    res.status(201).json({ success: true, flight });
  } catch (error) {
    next(error);
  }
};

// UPDATE FLIGHT
export const updateFlight = async (req, res, next) => {
  try {
    const flight = await Flight.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!flight) {
      return res.status(404).json({ error: "Flight not found" });
    }

    logger.info(`Flight updated: ${flight.flightId}`);
    res.json({ success: true, flight });
  } catch (error) {
    next(error);
  }
};

// DELETE FLIGHT
export const deleteFlight = async (req, res, next) => {
  try {
    const flight = await Flight.findByIdAndDelete(req.params.id);

    if (!flight) {
      return res.status(404).json({ error: "Flight not found" });
    }

    logger.warn(`Flight deleted: ${flight.flightId}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// HOTEL CRUD (MongoDB)


export const createHotel = async (req, res, next) => {
  try {
    const required = [
      "hotelName", "address", "city", "state", "zipCode",
      "starRating", "numberOfRooms", "roomType", "pricePerNight"
    ];

    const missing = validateRequired(req.body, required);
    if (missing) return res.status(400).json({ error: missing });

    const hotel = await Hotel.create(req.body);

    logger.info(`Hotel created: ${hotel.hotelName}`);
    res.status(201).json({ success: true, hotel });
  } catch (error) {
    next(error);
  }
};

export const updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    logger.info(`Hotel updated: ${hotel._id}`);
    res.json({ success: true, hotel });
  } catch (error) {
    next(error);
  }
};

export const deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);

    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    logger.warn(`Hotel deleted: ${hotel._id}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// CAR CRUD (MongoDB)

export const createCar = async (req, res, next) => {
  try {
    const required = [
      "carType", "companyName", "model", "year",
      "transmission", "seats", "dailyRentalPrice"
    ];

    const missing = validateRequired(req.body, required);
    if (missing) return res.status(400).json({ error: missing });

    const car = await Car.create(req.body);

    logger.info(`Car created: ${car.model}`);
    res.status(201).json({ success: true, car });
  } catch (error) {
    next(error);
  }
};

export const updateCar = async (req, res, next) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!car) return res.status(404).json({ error: "Car not found" });

    logger.info(`Car updated: ${car._id}`);
    res.json({ success: true, car });
  } catch (error) {
    next(error);
  }
};

export const deleteCar = async (req, res, next) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);

    if (!car) return res.status(404).json({ error: "Car not found" });

    logger.warn(`Car deleted: ${car._id}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// MODIFY USER (Admin Only)
 

export const modifyUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true }
    );

    if (!user) return res.json({ error: "User not found" });

    logger.info(`User modified by admin: ${req.params.userId}`);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// REVENUE REPORT (MySQL)

export const getRevenueReport = async (req, res, next) => {
  try {
    const [rows] = await db.query(query);
    const query = `
      SELECT 
        DATE_FORMAT(date_of_transaction, '%Y-%m') AS month,
        SUM(total_amount) AS revenue
      FROM billing
      GROUP BY DATE_FORMAT(date_of_transaction, '%Y-%m')
      ORDER BY month ASC;
    `;

    res.json({
      generatedAt: new Date().toISOString(),
      items: rows
    });
  } catch (error) {
    next(error);
  }
};

// TOP PROVIDERS (MongoDB or MySQL)

export const getTopProviders = async (req, res) => {
  try {
    const providers = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      {
        $group: {
          _id: "$providerId",
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$amount" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      generatedAt: new Date().toISOString(),
      providers
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load provider data" });
  }
};