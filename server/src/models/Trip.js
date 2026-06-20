const mongoose = require("mongoose");

const daySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  activities: [{ type: String }],
});

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    destination: { type: String, required: true },
    days: { type: Number, required: true },
    budgetType: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    interests: [{ type: String }],
    itinerary: [daySchema],
    budgetEstimate: {
      flights: Number,
      accommodation: Number,
      food: Number,
      activities: Number,
      total: Number,
    },
    hotels: [
      {
        name: String,
        category: String,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Trip", tripSchema);
