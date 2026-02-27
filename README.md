# HR Placement Transfer App

Node + Express + MSSQL web app for GCPS lateral transfer requests.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables:
   - `DB_SERVER`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
   - `PORT` (optional)
   - `BANNER_MESSAGE` (optional system-wide banner)
3. Create DB objects with `schema.sql`.
4. Start app:
   ```bash
   npm start
   ```

## Auth model

This sample expects upstream authentication. For local development you can simulate identity with headers:
- `x-user-id` requester identity
- `x-role` value `requester` or `admin`

or query params `?asUser=u123&asRole=admin`.

## Key behavior

- Single application per requester (unique `requesterId`).
- Requester can edit while status is `Submitted`; otherwise read-only.
- Admin dashboard groups requests by current school and allows status updates.
