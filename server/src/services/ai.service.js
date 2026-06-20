const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const callGemini = async (prompt) => {
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const cleanJson = (raw) => {
  return raw.replace(/```json|```/g, "").trim();
};
console.log("Using Gemini key:", process.env.GEMINI_API_KEY?.slice(0, 10));

const generateItinerary = async (destination, days, budgetType, interests) => {
  // TEMP MOCK — replace with real AI call once provider is sorted
  const itinerary = [];
  for (let i = 1; i <= days; i++) {
    itinerary.push({
      day: i,
      activities: [
        `Explore popular spots in ${destination}`,
        `Try local food related to ${interests[0] || "cuisine"}`,
      ],
    });
  }
  return itinerary;
};

const estimateBudget = async (destination, days, budgetType) => {
  // TEMP MOCK
  const multiplier =
    budgetType === "Low" ? 1 : budgetType === "Medium" ? 2 : 3.5;
  const base = days * 100 * multiplier;
  return {
    flights: Math.round(base * 0.4),
    accommodation: Math.round(base * 0.3),
    food: Math.round(base * 0.15),
    activities: Math.round(base * 0.15),
    total: Math.round(base),
  };
};

const suggestHotels = async (destination, budgetType) => {
  // TEMP MOCK — replace with real AI call once provider is sorted
  return [
    { name: `${destination} Budget Inn`, category: "Budget Friendly" },
    { name: `${destination} Grand Hotel`, category: "Mid Range" },
    { name: `${destination} Luxury Palace`, category: "Luxury" },
  ];
};
module.exports = { generateItinerary, estimateBudget, suggestHotels };
