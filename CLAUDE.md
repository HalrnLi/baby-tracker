# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Baby Tracker (宝宝护理追踪器) — A PWA for tracking baby care activities (feeding, pumping, diapers, weight). Full-stack TypeScript app with React frontend and Express backend.

## Tech Stack

- **Client**: React 18, Vite, TypeScript, Tailwind CSS, react-router-dom, axios
- **Server**: Express, TypeScript, Sequelize ORM, PostgreSQL, JWT auth
- **PWA**: vite-plugin-pwa with Workbox, Service Worker registered in `App.tsx`

## Common Commands

All commands run from repo root unless noted.

```bash
# Install dependencies for root + server + client
npm run install:all

# Development — runs server (port 3000) and client (port 5173) concurrently
npm run dev

# Build for production
npm run build           # builds client then server
npm run build:client    # cd client && tsc && vite build
npm run build:server    # cd server && tsc

# Start production server
npm run build && cd server && npm start   # node dist/index.js
```

### Client-specific (cd client)

```bash
npm run dev       # vite dev server on port 5173, proxies /api to localhost:3000
npm run build     # tsc && vite build
npm run lint      # eslint . --ext ts,tsx
npm run preview   # vite preview
```

### Server-specific (cd server)

```bash
npm run dev       # nodemon --exec ts-node src/index.ts
npm run build     # tsc → dist/
npm start         # node dist/index.js
npm run db:sync   # ts-node src/scripts/syncDb.ts
```

There is no test suite currently. If adding one, follow the client's Vite/React setup for frontend tests and the server's ts-node setup for backend tests.

## Architecture

### Client (`client/src/`)

- **`api/index.ts`** — Centralized API client using axios. All backend calls and TypeScript interfaces live here. The axios instance attaches the JWT token from `localStorage` via request interceptor.
- **`context/AuthContext.tsx`** — React context managing JWT auth. Token and serialized user are stored in `localStorage`. Provides `login`, `register`, `logout`.
- **`App.tsx`** — Router setup with `ProtectedRoute` wrapper and `AppSetup` (registers service worker, initializes `useReminders`). All functional routes are protected; unauthenticated users see `/login` or `/register`.
- **Pages** — Each major feature is a page component: `DashboardPage`, `FeedPage`, `PumpPage`, `DiaperPage`, `WeightPage`, `HistoryPage`, `StatsPage`, `SettingsPage`.
- **Hooks**:
  - `useReminders.ts` — Browser-based local reminder logic (not server push notifications). Uses `setInterval` to check reminder triggers.
  - `useSync.ts` — Handles syncing local records with the server via `/api/sync`.
- **Components** — `Layout.tsx` (page wrapper with bottom nav), `BottomNav.tsx` (tab navigation).

The Vite dev server proxies `/api` requests to `http://localhost:3000` (see `vite.config.ts`).

### Server (`server/src/`)

- **`index.ts`** — Express app setup. Middleware: CORS (allows all origins for mobile testing), JSON body parser. Mounts routes under `/api`. Calls `connectDatabase()` then `syncDatabase(false, true)` on startup.
- **`routes/index.ts`** — Router aggregator. Sub-routes: `/auth`, `/baby`, `/records`, `/reminders`, `/sync`, `/stats`, `/health`.
- **`middleware/auth.ts`** — JWT verification middleware. Expects `Authorization: Bearer <token>` header. Attaches `userId` to `AuthRequest`. Token expires in 30 days.
- **`config/database.ts`** — Sequelize PostgreSQL connection. Reads from `.env`. `syncDatabase(force, alter)` wraps `sequelize.sync()`.
- **Models** (`models/`): `User`, `Baby`, `Record`, `Reminder`. `Record.data` is a JSONB column storing type-specific payloads (feed, pump, diaper, weight).

### Database

PostgreSQL. Connection configured via `.env` (see `.env.example`). Sequelize syncs schema on server startup (`alter: true` in dev). There are no migrations; schema changes rely on Sequelize sync.

### Key Design Details

- **Record polymorphism**: The `Record` model uses a single table with `type` enum (`feed` | `pump` | `diaper` | `weight`) and a `data` JSONB column for type-specific fields. See `client/src/api/index.ts` for the TypeScript interfaces.
- **Sync strategy**: The client uses `/api/sync` to pull records created since `lastSync` and to push locally-created records. Conflict resolution is last-write-wins.
- **Reminders**: Stored in the DB but triggered locally in the browser via `useReminders`. No Web Push — notifications rely on the PWA being open.
- **Auth**: JWT stored in `localStorage`. All API calls include it via axios interceptor.
- **Tailwind theme**: Custom colors defined in `tailwind.config.js` — `primary: #F9D5D5`, `accent: #A8D8D8`, `background: #FFF9F5`, `text: #3A3A3A`. Font stack prioritizes Chinese system fonts (PingFang SC, Hiragino Sans GB, Microsoft YaHei).
- **Mobile-first PWA**: Designed for portrait mobile. Bottom tab nav, large touch targets. `vite-plugin-pwa` generates the service worker and manifest.

### Environment Variables (server `.env`)

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=baby_tracker
DB_USER=postgres
DB_PASSWORD=
JWT_SECRET=
```
