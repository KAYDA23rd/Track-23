const express = require("express");
const { protect, requireRole } = require("../auth/auth.middleware");
const trackingController = require("./tracking.controller");

const router = express.Router();

router.post("/location", protect, requireRole("DRIVER"), trackingController.upsertDriverLocation);
router.get("/live", protect, requireRole("ADMIN"), trackingController.getLiveDriverLocations);

module.exports = router;
