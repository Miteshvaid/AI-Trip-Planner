const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  createTrip,
  getMyTrips,
  getTripById,
  addActivity,
  removeActivity,
  regenerateDay,
  getHotelSuggestions,
} = require("../controllers/trip.controller");

router.use(protect);

router.post("/", createTrip);
router.get("/", getMyTrips);
router.get("/:id", getTripById);
router.get("/:id/hotels", getHotelSuggestions);
router.post("/:id/day/:dayNumber/activity", addActivity);
router.delete("/:id/day/:dayNumber/activity", removeActivity);
router.post("/:id/day/:dayNumber/regenerate", regenerateDay);

module.exports = router;
