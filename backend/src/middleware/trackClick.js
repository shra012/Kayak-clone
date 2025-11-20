import ClickLog from "../models/ClickLog.js";

export const trackClick = (actionType = "click") => {
  return async (req, res, next) => {
    try {
      await ClickLog.create({
        userId: req.user?.id || null,
        page: req.body.page || req.query.page || "unknown",
        listingId: req.body.listingId || null,
        section: req.body.section || null,
        action: actionType,
        metadata: req.body.metadata || {}
      });
    } catch (err) {
      console.error("Click logging failed:", err.message);
    }

    next();
  };
};