const Trip = require("../models/Trip");
const { generateItinerary, estimateBudget, suggestHotels } = require("../services/ai.service");

exports.createTrip = async (req, res) => {
  try {
    const { destination, days, budgetType, interests } = req.body;

    if (!destination || !days || !budgetType) {
      return res
        .status(400)
        .json({ error: "destination, days and budgetType are required" });
    }

    const [itinerary, budgetEstimate, hotels] = await Promise.all([
      generateItinerary(destination, days, budgetType, interests || []),
      estimateBudget(destination, days, budgetType),
      suggestHotels(destination, budgetType),
    ]);

    const trip = await Trip.create({
      userId: req.userId,
      destination,
      days,
      budgetType,
      interests: interests || [],
      itinerary,
      budgetEstimate,
      hotels,
    });

    res.status(201).json(trip);
  } catch (err) {
    console.error("Create trip error:", err);
    res
      .status(500)
      .json({ error: "Failed to create trip", details: err.message });
  }
};
exports.getHotelSuggestions = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    if (trip.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized to access this trip" });
    }

    const hotels = await suggestHotels(trip.destination, trip.budgetType);

    trip.hotels = hotels;
    await trip.save();

    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch hotel suggestions", details: err.message });
  }
};
exports.getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json(trips);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch trips", details: err.message });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    if (trip.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this trip" });
    }

    res.json(trip);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch trip", details: err.message });
  }
};

exports.addActivity = async (req, res) => {
  console.log("addActivity hit. params:", req.params, "| userId:", req.userId);
  try {
    const { id, dayNumber } = req.params;
    const { activity } = req.body;

    if (!activity) {
      return res.status(400).json({ error: "activity text is required" });
    }

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    if (trip.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this trip" });
    }

    const day = trip.itinerary.find((d) => d.day === Number(dayNumber));
    if (!day) return res.status(404).json({ error: "Day not found" });

    day.activities.push(activity);
    await trip.save();

    res.json(trip);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add activity", details: err.message });
  }
};

exports.removeActivity = async (req, res) => {
  try {
    const { id, dayNumber } = req.params;
    const { activityIndex } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    if (trip.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this trip" });
    }

    const day = trip.itinerary.find((d) => d.day === Number(dayNumber));
    if (!day) return res.status(404).json({ error: "Day not found" });

    if (activityIndex < 0 || activityIndex >= day.activities.length) {
      return res.status(400).json({ error: "Invalid activity index" });
    }

    day.activities.splice(activityIndex, 1);
    await trip.save();

    res.json(trip);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to remove activity", details: err.message });
  }
};

exports.regenerateDay = async (req, res) => {
  try {
    const { id, dayNumber } = req.params;
    const { preferences } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    if (trip.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this trip" });
    }

    const dayIndex = trip.itinerary.findIndex(
      (d) => d.day === Number(dayNumber),
    );
    if (dayIndex === -1)
      return res.status(404).json({ error: "Day not found" });

    const existingActivities = trip.itinerary
      .filter((d) => d.day !== Number(dayNumber))
      .flatMap((d) => d.activities);

    const newDayData = await generateItinerary(
      trip.destination,
      1,
      trip.budgetType,
      [...trip.interests, preferences].filter(Boolean),
    );
    let newActivities = newDayData[0]?.activities || [];
    const filtered = newActivities.filter(
      (a) => !existingActivities.includes(a),
    );
    // agar sab filter ho gaye (e.g. mock data identical hone ki wajah se), fallback original rakho
    newActivities = filtered.length > 0 ? filtered : newActivities;
    trip.itinerary[dayIndex].activities = newActivities;
    await trip.save();

    res.json(trip);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to regenerate day", details: err.message });
  }
};
