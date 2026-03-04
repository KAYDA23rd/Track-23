const express = require("express");
const router = express.Router();

const {
  createRoute,
  getRoutes,
  updateRoute,
  deleteRoute,
} = require("./route.controller");

const protect = require("../middleware/protect");

router.post("/", protect, createRoute);
router.get("/", protect, getRoutes);
router.put("/:id", protect, updateRoute);
router.delete("/:id", protect, deleteRoute);

module.exports = router;
