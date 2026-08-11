# CareLink — Web (Facility & CEO)

Phase 1 of the CareLink NEMT platform: the **Healthcare Facility portal** and the
**CEO / Fleet Admin dashboard**, built with Next.js 14 (App Router), TypeScript,
Tailwind CSS, Firebase, and Recharts. The **driver mobile app** is a later phase.

## Running

```bash
cd carelink
npm install
npm run dev        # http://localhost:3000
```

By default the app runs in **demo mode** with seeded in-memory data, so every
screen renders without a backend. To connect Cloud Firestore, copy
`.env.local.example` to `.env.local` and fill in your Firebase web config —
the data layer switches to live Firestore automatically when the vars are set.

```bash
npm run typecheck  # strict TS, no `any`
npm run build      # production build
```

## What's included

### Facility portal (`/facility`)
- **Booking flow** — locked static pickup address, urgency (Urgent/Today/Scheduled),
  patient details, special needs (Wheelchair / BLS / ALS / Stretcher / No Oxygen),
  dynamic drop-off, and provider selection ("Next available" proximity match or a
  "Specific provider" from the live available pool).
- **Live request list** — real-time via `onSnapshot` (mocked pub/sub in demo mode).
- **Live tracking** (`/facility/tracking/[tripId]`) — Uber-style dark map with a
  moving ambulance pin, floating pickup card, and a live ETA badge.

### CEO / Fleet Admin (`/ceo`)
- **KPI metrics** — Total, Completed, In-Progress, Canceled.
- **Timeframe filters** — Daily / Weekly / Monthly / Quarterly / Annual.
- **Request-volume chart** (Recharts), **driver ratings** with computed averages,
  **fleet leaderboard**, and a **dispatch density heatmap**.

## Architecture notes

| Concern | Where |
|---|---|
| Firestore schema (single source of truth) | `src/lib/types.ts` |
| Live/mock branching | `src/lib/firebase.ts` + `src/lib/data/*` |
| Dispatch spatial query | `findAvailableDrivers()` — `where("status","==","available")` |
| Analytics aggregation (pure, testable) | `src/lib/analytics.ts` |
| RBAC + PHI protection | `firestore.rules` |

## HIPAA / PHI handling

- Patient name and DOB (**PHI**) never appear in URLs or route params. The live
  tracking route is keyed by `tripId` only; `toPublicSummary()` strips PHI for any
  loggable/URL-bound payload.
- The real access boundary is **`firestore.rules`** (role-based custom claims),
  not the public web config keys. Deploy the rules alongside the app:
  `firebase deploy --only firestore:rules`.
- Facilities are scoped to their own `facilityId`; drivers to their own assigned
  trips; the CEO has read-only analytics access.

## Roles & auth (production)

Firebase Auth custom claims drive access: `role ∈ { facility, driver, ceo }`,
with `facilityId` / `driverId` scoping. In demo mode the facility is resolved
from the seed (`MOCK_FACILITY_ID`); wire real auth before production.
