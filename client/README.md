# AI Trip Planner ✈️

A full-stack, multi-user trip planning web application that uses an LLM agent to generate day-by-day travel itineraries, estimate trip budgets, suggest hotels, and allow dynamic itinerary editing — built as part of a Full-Stack Engineering Assessment.

**Live Demo:** [Frontend URL here]
**Backend API:** [Render URL here]
**Video Walkthrough:** [Video link here]
**GitHub Repo:** https://github.com/Miteshvaid/AI-Trip-Planner

---

## 1. Project Overview

Users can register, log in, and create personalized trip plans by providing a destination, number of days, budget level, and interests. An AI agent generates a structured day-wise itinerary, estimates the budget breakdown, and suggests hotels. Users can edit itineraries by adding/removing activities or regenerating a specific day. The app enforces strict per-user data isolation — no user can view or modify another user's trips.

---

## 2. Tech Stack

| Layer       | Technology                           |
| ----------- | ------------------------------------ |
| Frontend    | Next.js (App Router) + Tailwind CSS  |
| Backend     | Node.js + Express                    |
| Database    | MongoDB (Atlas) + Mongoose           |
| Auth        | JWT (JSON Web Tokens) + bcrypt       |
| AI Provider | Google Gemini API                    |
| Language    | JavaScript                           |
| Deployment  | Vercel (frontend) + Render (backend) |

**Note on JavaScript over TypeScript:** The assessment allows either. JavaScript was chosen to move faster within the deadline while still maintaining clean separation of concerns (routes → controllers → models → services) and meaningful naming conventions throughout.

---

## 3. Architecture

**Flow:** Frontend (Next.js, client components) → Axios → Express REST API → MongoDB (via Mongoose) and Gemini API (via `ai.service.js`).

---

## 4. Authentication & Authorization

- **Registration/Login:** Passwords hashed with `bcrypt` before storage. On successful login/register, a JWT (7-day expiry) containing the user's ID is issued.
- **Protecting routes:** An Express middleware (`auth.middleware.js`) verifies the JWT on every protected request and attaches `req.userId`.
- **Data isolation:** Every Trip document stores a `userId` field. All read/write operations on a trip explicitly check `trip.userId.toString() === req.userId` before proceeding, returning `403 Forbidden` otherwise. This was manually verified by creating two users and confirming User B receives a 403 when accessing User A's trip by ID.
- **Frontend:** JWT is stored in `localStorage`, attached to every API request via an Axios interceptor, and the app redirects to `/login` automatically on `401` responses or when an unauthenticated user accesses a protected page.

---

## 5. AI Agent Design

The AI logic lives entirely in `server/src/services/ai.service.js`, with three functions:

- `generateItinerary(destination, days, budgetType, interests)` — prompts Gemini to return a strict JSON itinerary (`{ itinerary: [{ day, activities }] }`)
- `estimateBudget(destination, days, budgetType)` — prompts Gemini for a JSON budget breakdown (flights, accommodation, food, activities, total)
- `suggestHotels(destination, budgetType)` — prompts Gemini for 3 hotel suggestions across Budget/Mid/Luxury categories

All prompts explicitly instruct the model to return **only valid JSON, no markdown**, which is then parsed directly — avoiding fragile regex-based text extraction.

**Regeneration with duplicate-avoidance:** When a user regenerates a specific day, the backend collects all activities already present in _other_ days of the same trip and filters the newly generated activities against that list, so regenerating Day 2 won't suggest an attraction already planned for Day 1. If filtering would empty the day entirely (e.g., due to limited variety), it falls back to the unfiltered set rather than returning an empty day.

**Graceful AI fallback (important design decision):** During development, the available Gemini API key was tied to an organization-restricted Google Cloud project with a free-tier quota of `0`, an account/policy limitation rather than a code defect. Rather than letting this block development or leave the app non-functional during demos, every AI function wraps its Gemini call in a `try/catch`: on failure (quota, network, parsing), it falls back to a deterministic, structurally-identical mock generator instead of crashing or surfacing an error to the user. This means:

- The full request/response contract (itinerary shape, budget shape, hotel shape) is identical whether AI succeeds or falls back.
- No frontend or controller code needs to change once a fully-provisioned API key is available — only the `ai.service.js` Gemini calls themselves activate.
- This mirrors a common production pattern: degrade gracefully when a third-party dependency is unavailable, rather than failing the whole request.

---

## 6. Editable Itinerary

- **Add activity:** `POST /api/trips/:id/day/:dayNumber/activity`
- **Remove activity:** `DELETE /api/trips/:id/day/:dayNumber/activity` (body: `{ activityIndex }`)
- **Regenerate day:** `POST /api/trips/:id/day/:dayNumber/regenerate` (body: `{ preferences }`, e.g. "more outdoor activities")

**Design decision:** Regenerating a day replaces _all_ of that day's activities, including manually added ones. The assessment's own example ("Regenerate Day 3 with more outdoor activities") implies a full refresh of the day rather than a partial merge, and partial-merge semantics would be ambiguous (which activities count as "AI-generated" vs "user-added" once saved to the same array). This is documented here as a known, intentional trade-off rather than a bug.

---

## 7. Creative / Custom Feature

**Duplicate-aware day regeneration** (described in Section 5) was chosen as the creative feature because it solves a real coherence problem the spec doesn't address: naively regenerating one day in isolation can easily suggest an attraction the user already has planned for another day in the same trip. By passing the existing itinerary's activities as context and filtering against them, the regenerated day stays consistent with the rest of the trip — a small but meaningful improvement in itinerary quality that demonstrates engineering judgment beyond the literal requirements.

---

## 8. Setup Instructions

### Local Setup

**Backend:**

```bash
cd server
npm install
# create a .env file (see .env.example) with:
# PORT=5000
# MONGO_URI=<your MongoDB Atlas URI>
# JWT_SECRET=<any long random string>
# GEMINI_API_KEY=<your Gemini API key>
# CLIENT_URL=http://localhost:3000
npm run dev
```

**Frontend:**

```bash
cd client
npm install
# create a .env.local file with:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

Visit `http://localhost:3000`.

### Deployed Setup

- **Backend:** Deployed on Render (Web Service), root directory `server`, build command `npm install`, start command `node src/server.js`. Environment variables configured in the Render dashboard.
- **Frontend:** Deployed on Vercel, root directory `client`, framework auto-detected as Next.js. `NEXT_PUBLIC_API_URL` environment variable points to the deployed Render backend URL.
- **Database:** MongoDB Atlas, with network access configured to allow connections from anywhere (`0.0.0.0/0`) since Render's free tier does not provide a static outbound IP.

---

## 9. Key Design Decisions & Trade-offs

| Decision                                          | Reasoning                                                                                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript over TypeScript                        | Faster iteration within the deadline; clean architecture maintained via folder structure and naming instead of static typing                                                                             |
| Express API routes instead of Next.js API routes  | Matches the assessment's "preferred tech stack" explicitly, and keeps backend fully independent/portable                                                                                                 |
| JWT in `localStorage` instead of httpOnly cookies | Simpler to implement and test within the timeframe; trade-off is slightly higher XSS exposure risk, acceptable for this assessment's scope                                                               |
| Full-day replace on regenerate                    | Avoids ambiguous partial-merge logic; documented as intentional                                                                                                                                          |
| AI fallback on failure instead of error response  | Keeps the app demonstrable end-to-end even if the third-party AI quota is exhausted, at the cost of occasionally serving non-AI content silently (logged server-side via `console.error` for visibility) |
| MongoDB `0.0.0.0/0` network access                | Required because Render's free tier doesn't expose a fixed IP; acceptable for a free-tier/demo deployment, would use VPC peering or IP allowlisting in a production environment                          |

---

## 10. Known Limitations

- AI-generated content depends on Gemini API quota; when exhausted, the app transparently falls back to structured mock data (see Section 5).
- No automated test suite was added due to time constraints; all flows were manually verified via Postman/PowerShell (auth, isolation, CRUD, edit/regenerate, hotels) and through the UI.
- Activities are stored as plain strings rather than objects with metadata (e.g., time of day, location, cost), which would be a natural next enhancement.
- No pagination on the trips list; would be needed at scale.
- Free-tier hosting (Render) spins down on inactivity, so the first request after idling may take ~30–50 seconds to respond.

---

## 11. API Endpoints Summary

| Method | Endpoint                                   | Description                                            |
| ------ | ------------------------------------------ | ------------------------------------------------------ |
| POST   | `/api/auth/register`                       | Register a new user                                    |
| POST   | `/api/auth/login`                          | Login, returns JWT                                     |
| POST   | `/api/trips`                               | Create a trip (AI-generated itinerary, budget, hotels) |
| GET    | `/api/trips`                               | List current user's trips                              |
| GET    | `/api/trips/:id`                           | Get a specific trip (ownership-checked)                |
| POST   | `/api/trips/:id/day/:dayNumber/activity`   | Add an activity to a day                               |
| DELETE | `/api/trips/:id/day/:dayNumber/activity`   | Remove an activity from a day                          |
| POST   | `/api/trips/:id/day/:dayNumber/regenerate` | Regenerate a day's activities                          |
| GET    | `/api/trips/:id/hotels`                    | Get/refresh hotel suggestions                          |

All `/api/trips/*` routes require `Authorization: Bearer <token>`.
