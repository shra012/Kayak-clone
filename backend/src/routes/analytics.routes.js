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

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/providers/top", topProviders);
router.get("/listings/top-clicks", topListingsByClicks);
router.get("/providers/ctr", providerCTR);
router.get("/cities", cityWiseAnalytics);
router.get("/listings/least-viewed", leastViewedListings);
router.get("/providers/daily-trend", providerDailyTrend);

export default router;