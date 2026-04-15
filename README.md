# HR Placement Transfer App

Node + Express + PostgreSQL web app for GCPS lateral transfer requests.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local env file from the template and edit values:
   ```bash
   cp .env.example .env
   ```

   This project uses `dotenv` (loaded in `src/server.js`) so values from `.env` are available via `process.env`.

   Supported environment variables:
   - `PGHOST` (or `DB_SERVER`)
   - `PGPORT` (or `DB_PORT`, default `5432`)
   - `PGDATABASE` (or `DB_NAME`)
   - `PGUSER` (or `DB_USER`)
   - `PGPASSWORD` (or `DB_PASSWORD`)
   - `PORT` (optional)
   - `BANNER_MESSAGE` (optional system-wide banner)
3. Create DB objects with `schema.sql`.
4. Start app:
   ```bash
   npm start
   ```

## E2E test commands

- `npm run test:e2e` runs tests once in CLI mode and exits.
- `npm run test:e2e:ui` opens the Playwright UI (interactive mode). This process stays running until you stop it manually.

## Auth model

This sample expects upstream authentication. For local development you can simulate identity with headers:
- `x-user-id` requester identity
- `x-role` value `requester` or `admin`

or query params `?asUser=u123&asRole=admin`.

## Key behavior

- Single application per requester (unique `requesterId`).
- Requester can edit while status is `Submitted`; otherwise read-only.
- Admin dashboard groups requests by current school and allows status updates.
