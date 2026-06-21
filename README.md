# DispatchLive Ops Challenge

DispatchLive is a starter project for realtime delivery operations, React performance, API correctness, and SDET automation practice. The app simulates 500 active riders, live location updates every 5 seconds, and a dispatch dashboard backed by a small Express API.

## Quick Start

```bash
npm install
npm test
npm run build
npm run dev
```

Open the dashboard at `http://localhost:5173`. The API runs on `http://localhost:5174`.

## What Is Already Built

- 500 seeded active couriers with changing locations.
- 2,500 seeded orders across pending, assigned, picked up, delivered, and cancelled states.
- `GET /api/dashboard` returns couriers and orders, with a simulated 500 ms API response time.
- `GET /api/location-stream` emits Server-Sent Events every 5 seconds.
- `GET /api/orders/count?from=<iso>&to=<iso>` returns order count for a half-open time window.
- `POST /api/dispatch/assign-next` assigns the next pending order to a courier.
- Baseline Vitest tests for API, dispatch scoring, and dashboard row generation.

## Candidate Mission

Use the product brief in [CANDIDATE_CHALLENGE.md](./CANDIDATE_CHALLENGE.md). The short version:

1. Make the React dashboard fast when 500 couriers receive location updates every 5 seconds.
2. Harden and expose order-count behavior for a given date/time frame.
3. Build SDET-style automation around assigning orders to delivery partners.

The starter is intentionally realistic rather than complete. Public tests should pass before you begin; add your own tests as you change behavior.

## Useful Commands

```bash
npm test              # Run all baseline tests
npm run build         # Type-check and build server + React app
npm run dev           # Run API and Vite dev server together
npm run dev:api       # API only, port 5174
npm run dev:web       # React app only, port 5173
```

## Project Structure

```text
src/
  client/
    App.tsx                 # React dashboard
    performance.ts          # Dashboard row aggregation
    useLiveLocations.ts     # SSE subscription and location merge helper
  server/
    app.ts                  # Express routes
    data.ts                 # Deterministic in-memory seed data
    dispatch.ts             # Assignment scoring
  shared/
    types.ts                # Shared API and domain types
```
