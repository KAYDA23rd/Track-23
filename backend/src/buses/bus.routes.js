const express = require("express");
const router = express.Router();

const {
  createBus,
  getBuses,
  updateBus,
  deleteBus,
} = require("./bus.controller");

const protect = require("../middleware/protect");

// ADMIN only
router.post("/", protect, createBus);
router.put("/:id", protect, updateBus);
router.delete("/:id", protect, deleteBus);

// Any logged-in user
router.get("/", protect, getBuses);

module.exports = router;
