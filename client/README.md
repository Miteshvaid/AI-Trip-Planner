# AI Trip Planner ✈️

A full-stack, multi-user trip planning app that uses an LLM agent to generate day-by-day travel itineraries, estimate budgets, suggest hotels, and let users edit their plans dynamically. Built for a Full-Stack Engineering Assessment.

- **Live App:** https://ai-trip-planner-black-seven.vercel.app
- **Backend API:** https://ai-trip-planner-22d1.onrender.com
- **Video Walkthrough:**(https://www.loom.com/share/5b7b6b36365d46d48768978eb43fa70e)
- **GitHub Repo:** https://github.com/Miteshvaid/AI-Trip-Planner

---

## Overview

Users register, log in, and create a trip by entering a destination, number of days, budget level, and interests. An AI agent generates a structured itinerary, a budget breakdown, and hotel suggestions. From there, users can add or remove activities and regenerate any specific day. Every trip is scoped strictly to its owner — no user can view or edit another user's trips.

---

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | Next.js (App Router) + Tailwind CSS |
| Backend    | Node.js + Express                   |
| Database   | MongoDB (Atlas) + Mongoose          |
| Auth       | JWT + bcrypt                        |
| AI         | Google Gemini API                   |
| Deployment | Vercel (frontend), Render (backend) |

JavaScript was used instead of TypeScript to move faster within the deadline — code organization (routes → controllers → models → services) and naming conventions cover the readability that TypeScript would otherwise help enforce.

---

## Architecture

client/ Next.js frontend

src/app/

register/, login/ auth pages

dashboard/ trip list

trips/new/ trip creation form

trips/[id]/ itinerary, editing, hotels

src/context/ AuthContext — global auth state

src/lib/api.js Axios instance with JWT interceptor
server/ Express backend

src/models/ User, Trip

src/controllers/ auth + trip logic

src/routes/ route definitions

src/middleware/ JWT auth middleware

src/services/ai.service.js Gemini integration + fallback

src/config/db.js MongoDB connection

Frontend → Axios → Express REST API → MongoDB + Gemini API.

---

## Authentication & Authorization

- Passwords are hashed with bcrypt before storage. Login/register issues a 7-day JWT containing the user's ID.
- An Express middleware verifies the JWT on every protected route and attaches `req.userId`.
- **Data isolation:** every Trip document stores a `userId`. All reads/writes check `trip.userId === req.userId` before proceeding, returning `403` otherwise. Verified manually by creating two users and confirming a 403 when one tries to access the other's trip directly.
- On the frontend, the JWT is stored in `localStorage` and attached to every request via an Axios interceptor. A `401` response or an unauthenticated visit to a protected page redirects to `/login`.

---

## AI Agent Design

All AI logic lives in `server/src/services/ai.service.js`, with three functions:

- `generateItinerary()` — returns a JSON itinerary (`{ day, activities }[]`)
- `estimateBudget()` — returns a JSON budget breakdown
- `suggestHotels()` — returns 3 hotels across Budget / Mid-range / Luxury

Prompts explicitly instruct the model to return only valid JSON, which is parsed directly rather than extracted with regex.

**Duplicate-aware regeneration:** when a day is regenerated, the backend collects activities already used in the trip's _other_ days and filters the newly generated ones against that list, so regenerating Day 2 won't repeat something already planned for Day 1. If filtering would leave a day empty, it falls back to the unfiltered set.

**Graceful AI fallback:** the Gemini key available during development was tied to an account with a free-tier quota of 0 — a provisioning limitation, not a code issue. To keep the app fully functional regardless, every AI function wraps its Gemini call in a try/catch and falls back to a randomized, structurally-identical generator on failure. The response shape is identical either way, so no other part of the app needs to change once a fully-provisioned key is used — only the Gemini call itself starts succeeding.

---

## Editable Itinerary

- `POST /api/trips/:id/day/:dayNumber/activity` — add an activity
- `DELETE /api/trips/:id/day/:dayNumber/activity` — remove an activity (`{ activityIndex }`)
- `POST /api/trips/:id/day/:dayNumber/regenerate` — regenerate a day (`{ preferences }`, optional)

Regenerating a day replaces all of that day's activities, including manually added ones. The assessment's own example phrasing ("Regenerate Day 3 with more outdoor activities") implies a full refresh rather than a partial merge — and partial merges would be ambiguous once activities are stored as plain strings in the same array. This is an intentional trade-off.

---

## Creative Feature

**Duplicate-aware day regeneration** was the creative addition — it solves a real coherence problem the spec doesn't address. Naively regenerating one day in isolation can easily suggest something already planned elsewhere in the same trip. By passing the rest of the itinerary as context and filtering against it, the regenerated day stays consistent with the trip as a whole.

---

## Setup

### Local

**Backend**

```bash
cd server
npm install
# .env:
# PORT=5000
# MONGO_URI=<MongoDB Atlas URI>
# JWT_SECRET=<any long random string>
# GEMINI_API_KEY=<Gemini API key>
# CLIENT_URL=http://localhost:3000
npm run dev
```

**Frontend**

```bash
cd client
npm install
# .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

Visit `http://localhost:3000`.

### Deployed

- **Backend:** Render Web Service, root directory `server`, build `npm install`, start `node src/server.js`.
- **Frontend:** Vercel, root directory `client`, framework auto-detected.
- **Database:** MongoDB Atlas, network access set to `0.0.0.0/0` since Render's free tier has no static outbound IP.

---

## Key Design Decisions

| Decision                                  | Why                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| JavaScript over TypeScript                | Faster iteration within the deadline                                                      |
| Express backend (not Next.js API routes)  | Matches the assessment's preferred stack, keeps backend portable                          |
| JWT in localStorage, not httpOnly cookies | Simpler to implement/test in the timeframe; slightly higher XSS exposure, acceptable here |
| Full-day replace on regenerate            | Avoids ambiguous partial-merge semantics                                                  |
| AI fallback instead of error on failure   | Keeps the app demonstrable end-to-end if the AI quota is exhausted                        |
| MongoDB open network access               | Required for Render's free tier; would use IP allowlisting/VPC peering in production      |

---

## Known Limitations

- AI content depends on Gemini quota; falls back to structured mock data when exhausted.
- No automated test suite — flows were verified manually (Postman/PowerShell + UI) for auth, isolation, CRUD, editing, and hotels.
- Activities are stored as plain strings, not objects with metadata (time, location, cost) — a natural next step.
- No pagination on the trips list.
- Render's free tier spins down on inactivity, so the first request after idling can take 30–50 seconds.

---

## API Reference

| Method | Endpoint                                   | Description                   |
| ------ | ------------------------------------------ | ----------------------------- |
| POST   | `/api/auth/register`                       | Register a new user           |
| POST   | `/api/auth/login`                          | Login, returns JWT            |
| POST   | `/api/trips`                               | Create a trip                 |
| GET    | `/api/trips`                               | List the current user's trips |
| GET    | `/api/trips/:id`                           | Get a specific trip           |
| POST   | `/api/trips/:id/day/:dayNumber/activity`   | Add an activity               |
| DELETE | `/api/trips/:id/day/:dayNumber/activity`   | Remove an activity            |
| POST   | `/api/trips/:id/day/:dayNumber/regenerate` | Regenerate a day              |
| GET    | `/api/trips/:id/hotels`                    | Get/refresh hotel suggestions |

All `/api/trips/*` routes require `Authorization: Bearer <token>`.
