import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import {
  topProviders,
  topListingsByClicks,
  providerCTR,
  cityWiseAnalytics,
  leastViewedListings,
  providerDailyTrend
} from "../controllers/providerAnalytics.controller.js";

const router = express.Router();

// For admin-only
router.use(authenticateToken);
router.use(requireAdmin);

// TOP PROVIDERS
router.get("/providers/top", topProviders);

// TOP LISTINGS BY CLICKS
router.get("/listings/top-clicks", topListingsByClicks);

// PROVIDER CTR (clicks vs views)
router.get("/providers/ctr", providerCTR);

// CITY-WISE HOTEL PERFORMANCE
router.get("/cities", cityWiseAnalytics);

// LEAST VIEWED LISTINGS
router.get("/listings/least-viewed", leastViewedListings);

// DAILY PROVIDER CLICK TREND
router.get("/providers/:providerId/daily-trend", providerDailyTrend);

export default router;