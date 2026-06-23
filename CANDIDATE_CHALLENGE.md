# DispatchLive Ops Candidate Challenge

## Scenario

DispatchLive runs realtime rider and delivery-agent tracking for a busy metro delivery operation. During peak hours the ops dashboard tracks 500 active couriers. Each courier sends a location update every 5 seconds, and dispatchers expect the dashboard to update in realtime.

The API is healthy and returns dashboard data in about 500 ms, but the React dashboard can take several seconds to render when the full courier and order dataset is loaded. Ops also needs accurate order counts for arbitrary date/time windows, and QA wants automation coverage for assigning orders to delivery partners.

## Your Tasks

### 1. Fix the Slow React Dashboard

Reproduce the slow render path, identify the bottleneck, and make dashboard updates responsive with 500 couriers and the current order volume.

Expected outcomes:

- The dashboard still shows courier status, load, active orders, and nearby pending orders.
- Location updates every 5 seconds do not trigger unnecessary full recomputation.
- Your implementation is readable and testable. Add or update tests for the aggregation logic you change.
- Document the before/after behavior in your final notes.

Starting point:

- `src/client/App.tsx`
- `src/client/performance.ts`
- `src/client/useLiveLocations.ts`

### 2. Order Counts by Date/Time Frame

Ops needs to know the number of orders for a selected date/time range.

Expected outcomes:

- Keep or improve `GET /api/orders/count?from=<iso>&to=<iso>`.
- Treat the range as half-open: `from <= createdAt < to`.
- Return clear validation errors for missing, invalid, or reversed ranges.
- Add tests for boundary cases and at least one realistic 24-hour window.
- Optional extension: support grouping by `status` or `hour`.

Starting point:

- `src/server/app.ts`
- `src/server/data.ts`
- `src/server/app.test.ts`

### 3. SDET Automation for Dispatch Assignment

Build confidence that order assignment works as couriers move and capacity changes.

Expected outcomes:

- Add automated tests for successful assignment and meaningful failure modes.
- Cover courier capacity, courier break status, non-pending orders, and no pending orders.
- Verify side effects, not just status codes: order status, assigned courier, courier load, and response body.
- If you find a bug or missing rule, fix it and keep the test that proves the behavior.

Starting point:

- `src/server/dispatch.ts`
- `src/server/data.ts`
- `src/server/app.ts`
- `src/server/dispatch.test.ts`

## Setup

```bash
npm install
npm test
npm run build
npm run dev
```

Open `http://localhost:5173` for the dashboard. The API is on `http://localhost:5174`.

## Deliverables

- Code changes.
- Tests that pass with `npm test`.
- A short written summary covering what changed, how you verified it, and what tradeoffs remain.
