# IMovies — Online Movie Ticket Booking System

A full-stack cinema ticketing demo built with React, TypeScript, Vite, Node.js, Express, and MongoDB/Mongoose. It includes movie discovery, showtimes, interactive seating, temporary seat holds, bookings, customer accounts, and an administrator dashboard.

## Technology

- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express REST API
- Database: MongoDB/Mongoose
- Authentication: JWT and bcrypt password hashing

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, copy the example file with:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

For local development, leave `MONGODB_URI` blank to use the embedded development database. Set a local `JWT_SECRET` in `.env`.

## Deployment (Railway)

This is a full-stack app; deploy the frontend and API together as one Node service.

1. Create a MongoDB Atlas database and a database user. Allow the deployment provider to connect, following Atlas network-access guidance.
2. In Railway, create a project and deploy this GitHub repository.
3. Add these Railway service variables:
   - `NODE_ENV=production`
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = a unique, long random secret
   - `ADMIN_EMAIL` = the email address you want for the production administrator
   - `ADMIN_PASSWORD` = a strong, unique administrator password
4. Railway uses `npm run build` and `npm start`; it provides the `PORT` variable automatically.
5. Wait for the deployment to become healthy, then open the generated public domain. Check `/api/health` and test registration, login, showtimes, seat holds, booking, cancellation, and admin access.

Never commit `.env`, database connection strings, API keys, or production passwords. If a credential was ever committed to a public repository, rotate it in the provider dashboard; deleting it from the latest file does not erase it from Git history.

## Demo accounts

Local development seeds sample data with these accounts:
- Admin: `admin@imovies.com` / `AdminPass123!`
- Customer: `user@imovies.com` / `UserPass123!`

These are **local demo credentials only**. In production, the administrator account must be configured with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Do not use the demo password on a public deployment.

## Build and tests

```bash
npm run build
npm run lint
npx tsx server/tests/run-tests.ts
```

## Health endpoint

`GET /api/health` reports service health and database connection state.
