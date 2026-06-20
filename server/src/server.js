require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const tripRoutes = require("./routes/trip.routes");
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
// test route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
