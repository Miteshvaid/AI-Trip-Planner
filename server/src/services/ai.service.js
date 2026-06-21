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

const generateItinerary = async (destination, days, budgetType, interests) => {
  const prompt = `Respond ONLY with valid JSON, no markdown, no explanation text.
Generate a ${days}-day itinerary for ${destination}.
Budget level: ${budgetType}.
Traveler interests: ${interests.join(", ") || "general sightseeing"}.

Return JSON in this exact schema:
{
  "itinerary": [
    { "day": 1, "activities": ["activity 1", "activity 2"] }
  ]
}`;

  try {
    const raw = await callGemini(prompt);
    const parsed = JSON.parse(cleanJson(raw));
    return parsed.itinerary;
  } catch (err) {
    console.error(
      "AI itinerary generation failed, using fallback:",
      err.message,
    );
    const activityPool = [
      `Explore popular spots in ${destination}`,
      `Try local food related to ${interests[0] || "cuisine"}`,
      `Visit a famous landmark in ${destination}`,
      `Wander through local markets`,
      `Relax at a scenic viewpoint`,
      `Take a guided walking tour`,
      `Visit a local museum or gallery`,
      `Enjoy outdoor activities nearby`,
      `Sample street food in the old town`,
      `Take photos at a popular viewpoint`,
    ];
    const itinerary = [];
    for (let i = 1; i <= days; i++) {
      const shuffled = [...activityPool].sort(() => Math.random() - 0.5);
      itinerary.push({ day: i, activities: shuffled.slice(0, 3) });
    }
    return itinerary;
  }
};

const estimateBudget = async (destination, days, budgetType) => {
  const prompt = `Respond ONLY with valid JSON, no markdown, no explanation.
Estimate travel costs in USD for a ${days}-day trip to ${destination} at a ${budgetType} budget level.

Return JSON in this exact schema:
{
  "flights": 0,
  "accommodation": 0,
  "food": 0,
  "activities": 0,
  "total": 0
}`;

  try {
    const raw = await callGemini(prompt);
    return JSON.parse(cleanJson(raw));
  } catch (err) {
    console.error("AI budget estimation failed, using fallback:", err.message);
    const base =
      budgetType === "Low" ? 80 : budgetType === "Medium" ? 150 : 300;
    const variance = 0.85 + Math.random() * 0.3; // 85% - 115% randomness
    const total = base * days * 3.9 * variance;
    return {
      flights: Math.round(total * 0.35),
      accommodation: Math.round(total * 0.3),
      food: Math.round(total * 0.2),
      activities: Math.round(total * 0.15),
      total: Math.round(total),
    };
  }
};

const suggestHotels = async (destination, budgetType) => {
  const prompt = `Respond ONLY with valid JSON, no markdown, no explanation.
Suggest 3 hotels in ${destination} for a ${budgetType} budget traveler, one each from Budget Friendly, Mid Range, and Luxury categories.

Return JSON in this exact schema:
{
  "hotels": [
    { "name": "Hotel Name", "category": "Budget Friendly" }
  ]
}`;

  try {
    const raw = await callGemini(prompt);
    const parsed = JSON.parse(cleanJson(raw));
    return parsed.hotels;
  } catch (err) {
    console.error("AI hotel suggestion failed, using fallback:", err.message);
    const namePool = [
      "Grand",
      "Royal",
      "Imperial",
      "Comfort",
      "Plaza",
      "Garden",
      "Sunrise",
      "Harbor",
      "Central",
      "Heritage",
      "Crown",
      "Palm",
    ];
    const typePool = ["Inn", "Hotel", "Resort", "Suites", "Lodge", "Residency"];

    const randomName = () =>
      `${namePool[Math.floor(Math.random() * namePool.length)]} ${destination} ${typePool[Math.floor(Math.random() * typePool.length)]}`;

    return [
      { name: randomName(), category: "Budget Friendly" },
      { name: randomName(), category: "Mid Range" },
      { name: randomName(), category: "Luxury" },
    ];
  }
};

module.exports = { generateItinerary, estimateBudget, suggestHotels };
