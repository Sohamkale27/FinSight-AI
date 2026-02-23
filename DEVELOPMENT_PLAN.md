## FinSight AI – Development Plan

FinSight AI aims to become a professional, multi-tenant AI-powered financial insights dashboard offered as a SaaS product.

This plan is organized into phases. Each phase can be iterated on, but should generally be completed (at least at an MVP level) before moving to the next.

---

## Phase 0 – Project Foundations (Current State Review)

- **Goals**
  - Audit the current codebase and clarify target use-cases and audiences (individuals, small businesses, startups, etc.).
  - Align on tech stack and basic architectural patterns.
- **Key Tasks**
  - Document current frontend behavior (dummy transactions, summary balance, layout).
  - Document current backend state (Node/Express skeleton, no active routes).
  - Write a short product brief: core value proposition, target users, primary use cases.
  - Decide initial hosting strategy (e.g. Render/Heroku/Fly.io/railway.app for backend, Netlify/Vercel/Static S3 for frontend).

Deliverable: Clear product brief, stack decisions, and this development plan agreed upon.

---

## Phase 1 – Solidify Core Architecture

- **Goals**
  - Turn the project into a cleanly structured, maintainable web app with separated frontend and backend concerns.
  - Prepare the codebase for scaling into a multi-tenant SaaS.
- **Key Tasks**
  - **Backend**
    - Implement an Express server (`server.js`) with:
      - Health check route (`GET /health`).
      - Versioned API prefix (e.g. `/api/v1`).
    - Establish folder structure:
      - `backend/src/server.js` (or keep root `server.js` but plan to modularize).
      - `backend/src/routes/`, `backend/src/controllers/`, `backend/src/models/`, `backend/src/config/`, `backend/src/services/`.
    - Add environment configuration via `.env` and a config loader (e.g. `dotenv`).
  - **Frontend**
    - Clarify whether to stay with vanilla JS + HTML or gradually move to a framework (e.g. React, Vue, or Svelte) for a richer SaaS dashboard.
    - Cleanly separate UI concerns:
      - `frontend/js/api.js` for all network calls.
      - `frontend/js/state.js` for global app state (user, transactions, settings).
      - `frontend/js/ui/` for rendering different panels/widgets.
  - **Tooling & Quality**
    - Add ESLint + Prettier configurations for both frontend and backend.
    - Add `npm run lint` and `npm run format` scripts.
    - Setup a basic test runner (Jest or Vitest) and write the first smoke tests.

Deliverable: Running app with clean architecture, basic health endpoints, and a frontend structured for growth.

---

## Phase 2 – Transaction API & Data Model

- **Goals**
  - Replace dummy in-browser data with persistent backend data.
  - Define a robust transaction model and CRUD APIs.
- **Key Tasks**
  - **Data Modeling**
    - Define core entities:
      - `User` (id, email, name, role, tenantId).
      - `Tenant` (id, name, billing info).
      - `Account` (id, userId/tenantId, type, currency).
      - `Transaction` (id, accountId, amount, description, category, type, timestamp, source).
    - Start with an SQL (Postgres) or NoSQL (MongoDB) database and choose an ORM/ODM (Prisma/Sequelize/TypeORM/Mongoose).
  - **APIs**
    - `GET /api/v1/transactions` – list transactions with pagination and filters (date range, category, type).
    - `POST /api/v1/transactions` – create a transaction.
    - `PUT /api/v1/transactions/:id` – update a transaction.
    - `DELETE /api/v1/transactions/:id` – soft-delete a transaction.
  - **Frontend Integration**
    - Replace local `transactions` array with data from the backend.
    - Implement optimistic UI updates when creating/editing/deleting transactions.
    - Add error handling and loading states.

Deliverable: Full CRUD transaction flow backed by a real database, used by the UI.

---

## Phase 3 – Authentication, Authorization & Multi-Tenancy

- **Goals**
  - Turn FinSight AI into a secure, multi-tenant SaaS platform.
  - Ensure each user/tenant can only access their own data.
- **Key Tasks**
  - **Authentication**
    - Implement email/password login and signup (consider using a provider like Auth0, Clerk, Supabase Auth, or a custom JWT-based solution).
    - Add password reset and email verification (directly or via identity provider).
  - **Authorization**
    - Define roles: `owner`, `admin`, `member`, `read-only`.
    - Enforce role-based access control (RBAC) on sensitive endpoints.
  - **Multi-Tenancy**
    - Decide on tenancy model:
      - Shared database with tenantId field on all tenant-scoped tables (simpler to start).
    - Ensure every transaction, account, and user is associated with a tenant.
    - Update queries to scope by tenantId and user permissions.
  - **Frontend Changes**
    - Add login/signup views.
    - Setup auth state (token/session storage, user info) and attach credentials in API calls.
    - Add basic account/tenant switcher UI if needed.

Deliverable: Secure, authenticated app where each customer sees only their own financial data.

---

## Phase 4 – Professional Dashboard UI & UX

- **Goals**
  - Transform the current simple page into a polished, multi-panel financial dashboard suitable for paying users.
- **Key Tasks**
  - **Layout & Navigation**
    - Implement an app shell:
      - Navbar/top bar (brand, user avatar, settings, logout).
      - Sidebar navigation (Dashboard, Transactions, Insights, Settings, Billing).
    - Use responsive design suitable for desktop and tablet (mobile later).
  - **Core Dashboard Widgets**
    - Summary cards: total balance, total income, total expenses, upcoming bills.
    - Charts (using a library like Chart.js, Recharts, or ECharts):
      - Spending over time.
      - Category breakdown (pie/donut).
      - Income vs expense trend.
    - Recent transactions table with sorting and filtering.
  - **UX Polish**
    - Loading skeletons/placeholders.
    - Empty states with copy that nudges users to import or add data.
    - Consistent typography, color palette, spacing, and iconography.

Deliverable: A visually compelling, interactive dashboard UI that feels like a modern SaaS product.

---

## Phase 5 – Data Ingestion & Integrations

- **Goals**
  - Make it easy for users to bring their financial data into FinSight AI.
- **Key Tasks**
  - **CSV/Excel Imports**
    - Frontend flow to upload CSV/Excel with transaction data.
    - Backend endpoint to parse, validate, and map columns to the transaction model.
    - Show a preview and mapping UI (e.g. select which CSV column maps to amount/date/category).
  - **Bank/Fintech Integrations (later)**
    - Explore integrating financial APIs (e.g. Plaid, SaltEdge, Truelayer, local providers depending on region).
    - Design a sync engine for periodically pulling new transactions.
  - **Webhooks & APIs**
    - Expose API keys per tenant for custom integrations.
    - Provide a simple developer guide for integrating external systems.

Deliverable: Users can import their data (at least via CSV) and start seeing insights quickly.

---

## Phase 6 – AI & Insight Engine

- **Goals**
  - Add genuine intelligence that differentiates FinSight AI from basic dashboards.
- **Key Tasks**
  - **Rule-Based Insights (MVP)**
    - Implement a rules engine that surfaces:
      - Highest spending categories this month.
      - Unusual spikes vs previous periods.
      - Upcoming cash shortfalls (projected).
  - **Categorization & Enrichment**
    - Auto-categorize transactions based on description and historical patterns.
    - Allow users to correct categories and learn from corrections.
  - **AI-Powered Features**
    - LLM-based natural language queries:
      - “How much did I spend on food last month?”
      - “What’s my average monthly savings rate this year?”
    - Summarized financial health reports:
      - Monthly/quarterly summaries in plain language.
    - Optional: Budget recommendations or goals planning.
  - **Implementation Considerations**
    - Decide whether to use external LLM APIs or self-hosted models.
    - Build a secure, privacy-aware prompt/data handling pipeline (strip PII, minimize data exposure).

Deliverable: Insightful, AI-driven recommendations and analytics that provide real value beyond basic charts.

---

## Phase 7 – Billing, Plans & SaaS Operations

- **Goals**
  - Turn FinSight AI into a monetized SaaS with subscription tiers.
- **Key Tasks**
  - **Subscription Management**
    - Integrate with a billing provider (Stripe, Paddle, etc.).
    - Define pricing tiers (Free, Pro, Business) and corresponding feature sets/limits.
  - **Billing Flows**
    - In-app upgrade/downgrade/cancel flows.
    - Handling trials, proration, and failed payments.
  - **Usage Limits**
    - Implement feature gating:
      - Seats per tenant.
      - Number of accounts/transactions.
      - Access to AI features and advanced insights.
  - **Legal & Compliance**
    - Publish Terms of Service and Privacy Policy.
    - Consider data retention policy and export/delete mechanisms.

Deliverable: Users can sign up, start a trial, upgrade to paid plans, and manage billing.

---

## Phase 8 – Reliability, Observability & Security Hardening

- **Goals**
  - Make the platform production-ready and trustworthy.
- **Key Tasks**
  - **Infrastructure & Reliability**
    - Set up automated deployments (CI/CD pipeline).
    - Add proper environment separation (dev, staging, production).
    - Configure automatic backups for the database.
  - **Monitoring & Logging**
    - Centralized logging for backend (request logs, error logs).
    - Metrics and alerts (uptime, error rate, latency).
  - **Security**
    - Harden HTTP security (HTTPS, HSTS, secure cookies).
    - Perform basic security review: SQL injection, XSS, CSRF, rate limiting.
    - Periodic dependency scanning and updates.

Deliverable: Stable, observable production environment with basic security best practices in place.

---

## Phase 9 – Growth, Feedback & Iteration

- **Goals**
  - Improve the product based on real user feedback and usage data.
- **Key Tasks**
  - Instrument analytics (e.g. page views, feature usage).
  - Add in-app feedback mechanisms and a public roadmap/changelog.
  - Prioritize improvements: performance, UX tweaks, new AI use cases.
  - Explore integrations with other tools (Slack/email summaries, accounting tools, etc.).

Deliverable: A continuously improving product guided by real-world usage and feedback.

---

## Working Style & Prioritization Notes

- Start by getting **one narrow slice** production-ready (auth + transactions + basic dashboard) before adding complex AI features.
- Aim for **small, shippable increments** per phase; don’t let large features stay half-finished for long.
- Keep technical debt visible in a backlog, but bias towards features that clearly improve user value or platform stability.

