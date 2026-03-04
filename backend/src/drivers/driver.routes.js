const express = require("express");
const router = express.Router();

const {
  createDriver,
  getDrivers,
  updateDriver,
  deleteDriver,
} = require("./driver.controller");

const protect = require("../middleware/protect");

router.post("/", protect, createDriver);
router.get("/", protect, getDrivers);
router.put("/:id", protect, updateDriver);
router.delete("/:id", protect, deleteDriver);

module.exports = router;
