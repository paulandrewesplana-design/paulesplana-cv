# Casino Content Hub — System Architecture Design

**A modular, multi-tenant B2B SaaS platform for independent casino agents.**

This document describes a high-level system architecture, a recommended
Firebase / Google Workspace service mapping, and the database schema for the
four core subsystems: **Multi-tenancy**, the **Content Factory**, the
**Feedback Loop**, and **Monetization**.

> ⚠️ **Compliance is a first-class concern.** Gambling content is heavily
> regulated (UKGC, MGA, ADM, various US state regulators, plus platform ad
> policies on Meta/TikTok/Google). The architecture below treats the
> compliance ruleset as versioned data and gates every generated asset behind
> a review state — never publish AI output unreviewed.

---

## 1. High-Level System Architecture

The platform is a set of loosely coupled services around a single source of
truth (Firestore) with an event-driven Content Factory pipeline.

```
                          ┌───────────────────────────────────────┐
                          │            CLIENT (SPA)               │
                          │  React / Next.js on Firebase Hosting  │
                          │  - Agent workspace UI                 │
                          │  - Content editor + asset picker      │
                          │  - Analytics dashboard                │
                          │  - Billing / credits screen           │
                          └───────────────┬───────────────────────┘
                                          │ Firebase Auth (JWT, custom claims)
                                          │ HTTPS / callable functions
                          ┌───────────────▼───────────────────────┐
                          │        API / ORCHESTRATION LAYER      │
                          │     Cloud Functions / Cloud Run       │
                          │  ┌─────────────┬──────────────────┐   │
                          │  │ Content     │ Billing          │   │
                          │  │ Factory     │ (Stripe)         │   │
                          │  │ Orchestrator│                  │   │
                          │  └──────┬──────┴────────┬─────────┘   │
                          └─────────┼───────────────┼─────────────┘
             ┌────────────┬─────────┼───────┬───────┼───────────┬───────────────┐
             ▼            ▼         ▼       ▼       ▼           ▼               ▼
      ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐   ┌──────────────┐
      │ Firestore│ │ Vertex AI│ │ Google │ │  Stripe  │ │  Pub/Sub │   │Cloud Tasks / │
      │ (source  │ │ /Gemini  │ │ Drive  │ │  (credits│ │ (events) │   │  Scheduler   │
      │ of truth)│ │ (LLM)    │ │(assets)│ │ /billing)│ │          │   │ (async jobs) │
      └──────────┘ └──────────┘ └────────┘ └──────────┘ └──────────┘   └──────────────┘
             ▲                                                                  │
             └──────────────── Feedback Loop (metrics ingestion) ◀─────────────┘
```

### Design principles

| Principle | Implementation |
|-----------|----------------|
| **Modularity** | Each subsystem (factory, feedback, billing) is an independently deployable Cloud Function group / Cloud Run service. They communicate through Firestore documents and Pub/Sub events, not direct calls. |
| **Multi-tenant isolation** | Every document carries an `agentId` (tenant key). Firestore Security Rules enforce row-level isolation using Auth custom claims. |
| **Event-driven pipeline** | The Content Factory is a state machine advanced by Firestore triggers + Pub/Sub, so long-running steps (LLM generation, asset mapping) never block the UI. |
| **Compliance as data** | Guidelines are versioned documents; every script stores the `guidelineVersion` it was validated against for auditability. |
| **Idempotency & credits** | Every billable operation reserves credits atomically (Firestore transaction) before doing work, and refunds on failure. |

---

## 2. The Four Subsystems

### 2.1 Multi-Tenancy

**Tenant model:** An **Agency** (organization) is the billing entity; **Agents**
(users) belong to an agency. This supports both solo agents (agency of one) and
small teams without a schema change.

- **Firebase Authentication** issues JWTs. On sign-up, a Cloud Function sets
  **custom claims**: `{ agencyId, role }` (`role` ∈ `owner | editor | viewer`).
- **Firestore Security Rules** read `request.auth.token.agencyId` and compare it
  to the document's `agencyId` field — this is the enforcement boundary. The
  client is never trusted to filter tenants.
- Data is **partitioned by `agencyId`** at the top level of the document tree,
  which also makes per-tenant export/delete (GDPR) and per-tenant usage
  metering trivial.

```javascript
// firestore.rules — tenant isolation core
function belongsToTenant(resource) {
  return request.auth != null
      && request.auth.token.agencyId == resource.data.agencyId;
}
match /scripts/{scriptId} {
  allow read, update, delete: if belongsToTenant(resource);
  allow create: if request.auth.token.agencyId == request.resource.data.agencyId;
}
```

### 2.2 Content Factory (the core workflow)

A pipeline modeled as a **state machine** on a `scripts` document. Each stage is
advanced by a Firestore/Pub-Sub triggered function so the UI only ever reads
state.

```
 draft ──► generating ──► compliance_check ──► mapping_assets ──► ready_for_review ──► approved ──► published
   │            │                │                                        │
   │            └── failed ◄──────┴──────────────── rejected ◄────────────┘
   └── (credit reserved)                         (human in the loop)
```

1. **Raw input** — Agent submits a brief (product, offer, target persona,
   platform, language). A credit is **reserved** in the same transaction that
   creates the `scripts` doc (`status: generating`).
2. **Script generation** — Orchestrator calls **Vertex AI (Gemini)** with a
   prompt assembled from: the raw brief + the active **compliance guideline
   version** + the **optimized persona/hook parameters** from the Feedback Loop
   (§2.3). The compliance rules are injected as system instructions *and*
   re-checked in step 3 (belt and suspenders).
3. **Compliance validation** — A dedicated function runs the generated script
   through a rules engine: deterministic checks (banned phrases like
   "risk-free", missing age/responsible-gambling disclaimers, prohibited
   targeting language) **plus** an LLM "compliance grader" pass. Failures route
   to `rejected` with annotated reasons; the guideline version is stamped on the
   doc.
4. **Asset mapping** — The script's scene/segment list is matched to
   **Google Drive** video/image assets. Assets are indexed in Firestore
   (`content_assets`) with tags/embeddings; mapping is a semantic + tag search,
   producing an ordered shot list referencing Drive `fileId`s.
5. **Human review** — Nothing is published without an agent approving
   (`ready_for_review → approved`). This is the compliance safety gate.

### 2.3 Feedback Loop (performance-driven optimization)

Closes the loop from published content back into generation parameters.

- **Ingestion:** Performance metrics (views, CTR, conversions, spend) land in
  Firestore `performance_logs`, written either by a webhook from the ad
  platform, a scheduled **Cloud Scheduler → Cloud Function** poller, or manual
  CSV upload.
- **Aggregation:** A scheduled job rolls raw logs into per-`(persona, hook,
  platform)` aggregates and computes a score (e.g. conversion-rate weighted by
  volume, with a Bayesian/Wilson lower-bound to avoid rewarding tiny samples).
- **Optimization:** These aggregates populate a `persona_profiles` /
  `hook_strategies` ranking per agency. When the Content Factory generates a new
  script, the orchestrator selects the top-ranked persona + hook (with an
  ε-greedy exploration factor so new variants still get airtime — a lightweight
  multi-armed bandit) and injects them into the generation prompt.

```
 performance_logs ──► (scheduled aggregation) ──► persona_profiles / hook_strategies
        ▲                                                     │
        │                                                     ▼
   published content ◀──── Content Factory (reads top-ranked persona+hook)
```

### 2.4 Monetization (usage-based credits via Stripe)

- **Model:** Prepaid **credits**. Each billable action (a generation, a
  compliance re-run, a premium export) has a credit cost defined in a
  `pricing_config` document, so pricing is tunable without a deploy.
- **Purchase:** Stripe **Checkout** (one-off credit packs) and/or **subscriptions**
  with monthly credit grants. A **Stripe webhook → Cloud Function** is the only
  writer that *increases* credit balance, verified by signature.
- **Consumption:** The Content Factory **reserves** credits in a Firestore
  transaction before starting work and **commits** on success or **refunds** on
  failure — guaranteeing no double-spend and no charge for failed jobs.
- **Ledger:** Every change is an append-only `credit_ledger` entry
  (`+purchase`, `-consumption`, `+refund`) so the balance is always reconstructable
  and auditable. `stripe/customerId` links the agency to Stripe.

```
Stripe Checkout ──► webhook (signed) ──► credit_ledger(+) ──► agency.creditBalance
Content Factory ──► txn: reserve ──► do work ──► commit(-) | refund(+)
```

---

## 3. Recommended Firebase / Google Workspace Service Mapping

| Concern | Service | Why |
|---------|---------|-----|
| **Frontend hosting** | **Firebase Hosting** (+ CDN) | Global CDN, atomic deploys, tight Auth integration. Serve a Next.js/React SPA. |
| **Authentication & tenancy** | **Firebase Authentication** + custom claims | Managed identity; claims carry `agencyId`/`role` for rule-based isolation. |
| **Primary datastore** | **Cloud Firestore** | Real-time listeners drive the pipeline UI; security rules give row-level multi-tenant isolation. Source of truth. |
| **Orchestration / API** | **Cloud Functions** (event + callable) and **Cloud Run** for heavier/longer jobs | Functions for triggers & webhooks; Cloud Run for long LLM/asset work that exceeds function limits. |
| **Async / decoupling** | **Pub/Sub** + **Cloud Tasks** | Stage-to-stage pipeline events; Cloud Tasks for rate-limited, retriable LLM calls. |
| **Scheduled jobs** | **Cloud Scheduler** | Metrics polling, nightly aggregation, credit reconciliation. |
| **AI generation** | **Vertex AI — Gemini** | Script writing + compliance grading; native GCP auth, no key sprawl. |
| **Semantic asset search** | **Vertex AI embeddings** + Firestore vector index | Map script scenes → the right Drive asset. |
| **Asset storage** | **Google Drive** (via Drive API, Workspace) | Requirement: assets live in Drive. Store `fileId` in Firestore; use a **Workspace service account with domain-wide delegation** or per-agency OAuth to read. Use Firebase **Cloud Storage** only for platform-generated thumbnails/renders. |
| **Metrics / analytics store** | **Firestore** (hot, recent) + **BigQuery** (cold, historical) | Firestore for the live feedback loop; BigQuery (via Firestore export) for heavy historical analytics and ML. |
| **Payments** | **Stripe** (Checkout, Billing, Webhooks) | Usage-based credits, subscriptions, tax handling. |
| **Secrets** | **Secret Manager** | Stripe keys, Drive service-account creds — never in code/config. |
| **Observability** | **Cloud Logging / Monitoring / Error Reporting** | Per-tenant traces, pipeline alerting, credit anomaly alerts. |

**Workspace note:** because assets are in **Google Drive**, run the platform in
a Google Workspace / Google Cloud org and access Drive with a **service account
(domain-wide delegation)** scoped to the shared drive holding agency assets, or
have each agency connect their own Drive via OAuth. Keep a Firestore index
(`content_assets`) mirroring Drive metadata so the Content Factory never has to
hit the Drive API on the hot path.

---

## 4. Database Schema (Firestore)

Collections are top-level and every document carries `agencyId` for isolation.
Sub-collections are used where data is strictly owned by a parent and rarely
queried across tenants.

### 4.1 Agencies & Agents (tenancy + billing)

```
/agencies/{agencyId}
{
  name: string,
  createdAt: timestamp,
  ownerUid: string,
  stripe: {
    customerId: string,
    subscriptionId: string | null,
    plan: "starter" | "pro" | "agency" | null
  },
  creditBalance: number,           // denormalized from credit_ledger for fast reads
  activeGuidelineVersion: string,  // e.g. "ukgc-2025.1"
  settings: {
    defaultLanguage: string,
    defaultPlatform: "tiktok" | "meta" | "youtube",
    driveRootFolderId: string      // where this agency's assets live
  }
}

/agencies/{agencyId}/members/{uid}    // or model via custom claims only
{
  uid: string,
  email: string,
  role: "owner" | "editor" | "viewer",
  invitedAt: timestamp,
  status: "active" | "invited" | "disabled"
}
```

### 4.2 Content Assets (Google Drive index)

```
/content_assets/{assetId}
{
  agencyId: string,                // tenant key
  driveFileId: string,             // Google Drive file id (source of truth for the binary)
  driveUrl: string,
  type: "video" | "image",
  mimeType: string,
  title: string,
  durationSec: number | null,      // video only
  dimensions: { w: number, h: number },
  tags: string[],                  // e.g. ["slot", "big-win", "closeup", "neon"]
  embedding: number[],             // Vertex AI vector for semantic mapping
  usageRights: {                   // compliance: is this asset cleared to use?
    licensed: boolean,
    expiresAt: timestamp | null,
    restrictions: string[]         // e.g. ["no-minors", "eu-only"]
  },
  performanceScore: number,        // rolled up from performance_logs (assets that convert)
  createdAt: timestamp,
  syncedAt: timestamp              // last Drive metadata sync
}
```

### 4.3 Scripts (Content Factory state machine)

```
/scripts/{scriptId}
{
  agencyId: string,                // tenant key
  createdBy: string,               // uid
  status: "draft" | "generating" | "compliance_check" | "mapping_assets"
        | "ready_for_review" | "approved" | "published"
        | "rejected" | "failed",
  brief: {                         // raw input
    product: string,
    offer: string,
    targetPersonaHint: string,
    platform: string,
    language: string
  },
  generation: {
    model: string,                 // e.g. "gemini-2.x"
    personaId: string,             // chosen by feedback loop
    hookId: string,                // chosen by feedback loop
    promptVersion: string,
    creditsReserved: number,
    creditsCharged: number
  },
  script: {
    hook: string,
    body: string,
    cta: string,
    disclaimers: string[],         // responsible-gambling, age, T&Cs
    segments: [                    // ordered scenes for asset mapping
      { index: number, text: string, assetId: string | null, driveFileId: string | null }
    ]
  },
  compliance: {
    guidelineVersion: string,      // stamped for audit
    status: "pass" | "fail" | "manual_review",
    violations: [ { rule: string, severity: "block" | "warn", detail: string } ],
    checkedAt: timestamp,
    reviewedBy: string | null      // human approver uid
  },
  publish: {
    platform: string,
    externalPostId: string | null, // links to performance_logs
    publishedAt: timestamp | null
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4.4 Performance Logs (feedback loop input)

```
/performance_logs/{logId}
{
  agencyId: string,                // tenant key
  scriptId: string,                // link back to the source content
  externalPostId: string,          // platform's post/ad id
  platform: "tiktok" | "meta" | "youtube",
  personaId: string,               // denormalized for fast aggregation
  hookId: string,                  // denormalized for fast aggregation
  assetIds: string[],
  metrics: {
    impressions: number,
    views: number,
    clicks: number,
    conversions: number,           // deposits / sign-ups
    spend: number,
    ctr: number,                   // derived
    conversionRate: number         // derived
  },
  window: { start: timestamp, end: timestamp },  // reporting period
  ingestedAt: timestamp,
  source: "webhook" | "poller" | "manual_upload"
}
```

### 4.5 Optimization state (feedback loop output)

```
/persona_profiles/{personaId}          // scoped by agencyId field
{
  agencyId: string,
  label: string,                        // e.g. "high-roller VIP"
  descriptor: string,                   // injected into generation prompt
  stats: {
    sampleSize: number,
    avgConversionRate: number,
    scoreLowerBound: number             // Wilson/Bayesian score used for ranking
  },
  rank: number,
  updatedAt: timestamp
}

/hook_strategies/{hookId}               // same shape, for opening hooks
{ agencyId, label, template, stats, rank, updatedAt }
```

### 4.6 Billing ledger (monetization)

```
/credit_ledger/{entryId}
{
  agencyId: string,                // tenant key
  type: "purchase" | "consumption" | "refund" | "grant" | "adjustment",
  amount: number,                  // signed: + credits added, - consumed
  balanceAfter: number,
  ref: {
    scriptId: string | null,       // for consumption/refund
    stripeEventId: string | null,  // for purchase (idempotency key)
    stripePaymentIntent: string | null
  },
  reason: string,
  createdAt: timestamp
}

/pricing_config/{version}          // global, not tenant-scoped
{
  costs: { generation: number, complianceRecheck: number, premiumExport: number },
  creditPacks: [ { sku: string, credits: number, priceUsd: number } ],
  effectiveFrom: timestamp
}
```

### Key indexing & query patterns

| Query | Index |
|-------|-------|
| Agent's scripts by status | composite: `agencyId ASC, status ASC, updatedAt DESC` |
| Assets by tag for mapping | array-contains on `tags` + `agencyId`; vector index on `embedding` |
| Aggregate metrics by persona/hook | composite: `agencyId, personaId, window.start` (or export to BigQuery) |
| Ledger reconciliation | `agencyId ASC, createdAt DESC`; `stripeEventId` unique for idempotency |

---

## 5. Cross-Cutting Concerns

- **Idempotency:** Stripe webhooks keyed by `stripeEventId`; LLM jobs keyed by
  `scriptId + promptVersion` so retries never double-charge or duplicate work.
- **Auditability:** `guidelineVersion` on every script and an append-only
  `credit_ledger` give you a defensible paper trail for regulators and billing
  disputes.
- **Data residency:** Choose Firestore/Vertex regions to match the agency's
  jurisdiction (EU data in EU) — relevant for GDPR and gambling regulators.
- **Rate limiting & cost control:** Cloud Tasks throttles LLM calls; per-agency
  credit balance is itself a natural spend cap.
- **Human-in-the-loop:** No AI-generated gambling content is ever published
  without an explicit `approved` transition by an authenticated agent — this is
  both a compliance control and a quality gate.

---

## 6. Suggested Build Order (MVP → v1)

1. **Tenancy skeleton** — Auth + custom claims + Firestore rules + agency/member docs.
2. **Content Factory happy path** — brief → Gemini generation → manual asset pick → review/approve (no feedback loop yet).
3. **Drive integration** — `content_assets` sync + semantic mapping.
4. **Monetization** — credit ledger, Stripe Checkout, reserve/commit in the factory.
5. **Compliance engine** — versioned guidelines + rules + LLM grader gate.
6. **Feedback loop** — metrics ingestion → aggregation → persona/hook ranking → prompt injection with ε-greedy exploration.
7. **Scale-out** — BigQuery analytics, Cloud Run for heavy jobs, multi-region.
