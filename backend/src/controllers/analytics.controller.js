import ClickLog from "../models/ClickLog.js";
import Booking from "../models/Booking.js";
import Flight from "../models/Flight.js";
import Hotel from "../models/Hotel.js";
import Car from "../models/Car.js";

/**
 * TOP PROVIDERS (Revenue + Bookings)
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
 * PROVIDER CTR (Clicks vs Views)
 */
export const providerCTR = async (req, res) => {
  try {
    // 1. Get provider→listing mapping
    const allListings = [
      ...await Flight.find({}, "_id providerId"),
      ...await Hotel.find({}, "_id providerId"),
      ...await Car.find({}, "_id providerId")
    ];

    const listingIds = allListings.map(l => l._id.toString());

    // 2. Aggregate clicks
    const clicks = await ClickLog.aggregate([
      {
        $match: { listingId: { $in: listingIds } }
      },
      {
        $group: {
          _id: "$listingId",
          clicks: { $sum: 1 }
        }
      }
    ]);

    // 3. Aggregate views
    const views = await ClickLog.aggregate([
      {
        $match: {
          action: "view",
          listingId: { $in: listingIds }
        }
      },
      {
        $group: {
          _id: "$listingId",
          views: { $sum: 1 }
        }
      }
    ]);

    // 4. Merge CTR results
    const result = allListings.map(listing => {
      const clicked = clicks.find(c => c._id == listing._id.toString());
      const viewed = views.find(v => v._id == listing._id.toString());

      const clicksCount = clicked?.clicks ?? 0;
      const viewsCount = viewed?.views ?? 0;

      return {
        listingId: listing._id.toString(),
        providerId: listing.providerId,
        clicks: clicksCount,
        views: viewsCount,
        CTR: viewsCount > 0 ? ((clicksCount / viewsCount) * 100).toFixed(2) + "%" : "0%"
      };
    });

    res.json(result);

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
 * LEAST VIEWED LISTINGS
 */
export const leastViewedListings = async (req, res) => {
  try {
    const result = await ClickLog.aggregate([
      {
        $match: { listingId: { $ne: null } }
      },
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
 * PROVIDER DAILY PERFORMANCE TREND
 */
export const providerDailyTrend = async (req, res) => {
  try {
    const { providerId } = req.params;

    const result = await ClickLog.aggregate([
      {
        $match: { providerId }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
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