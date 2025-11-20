import ClickLog from "../models/ClickLog.js";
import Booking from "../models/Booking.js";
import Flight from "../models/Flight.js";
import Hotel from "../models/Hotel.js";
import Car from "../models/Car.js";

/**
 * TOP PROVIDERS (Views + Revenue)
 */
export const topProviders = async (req, res) => {
  try {
    const result = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      {
        $group: {
          _id: "$providerId",
          totalRevenue: { $sum: "$amount" },
          totalBookings: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * TOP LISTINGS by Clicks
 */
export const topListingsByClicks = async (req, res) => {
  try {
    const result = await ClickLog.aggregate([
      { $match: { listingId: { $ne: null } } },
      {
        $group: {
          _id: "$listingId",
          totalClicks: { $sum: 1 }
        }
      },
      { $sort: { totalClicks: -1 } },
      { $limit: 10 }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PROVIDER CLICK-THROUGH-RATE (Clicks / Impressions)
 */
export const providerCTR = async (req, res) => {
  try {
    const clicks = await ClickLog.aggregate([
      {
        $group: {
          _id: "$listingId",
          clicks: { $sum: 1 }
        }
      }
    ]);

    const totalListings = [
      ...await Flight.find({}, "_id providerId"),
      ...await Hotel.find({}, "_id providerId"),
      ...await Car.find({}, "_id providerId")
    ];

    const data = totalListings.map(listing => {
      const click = clicks.find(c => c._id == listing._id.toString());
      const totalClicks = click ? click.clicks : 0;
      return {
        listingId: listing._id.toString(),
        providerId: listing.providerId,
        CTR: totalClicks
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * CITY-WISE PROPERTY PERFORMANCE
 */
export const cityWiseAnalytics = async (req, res) => {
  try {
    const hotels = await Hotel.aggregate([
      {
        $group: {
          _id: "$city",
          listings: { $sum: 1 },
          avgPrice: { $avg: "$pricePerNight" }
        }
      },
      { $sort: { listings: -1 } }
    ]);

    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * LISTINGS WITH LEAST CLICKS (to identify poor performers)
 */
export const leastViewedListings = async (req, res) => {
  try {
    const result = await ClickLog.aggregate([
      {
        $group: {
          _id: "$listingId",
          views: { $sum: 1 }
        }
      },
      { $sort: { views: 1 } },
      { $limit: 10 }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DAILY PROVIDER PERFORMANCE TREND
 */
export const providerDailyTrend = async (req, res) => {
  try {
    const result = await ClickLog.aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            providerId: "$providerId"
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};