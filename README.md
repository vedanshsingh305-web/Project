# IMovies — Online Movie Ticket Booking System

A modern, full-stack cinema ticketing web platform built with Node.js, Express, MongoDB (Mongoose), React, and Tailwind CSS. Features real-time visual seating layouts, concurrency locking against double bookings, temporary reservation expiration, role-based customer and administrator dashboards, and digital ticket passes.

---

## 1. Features

- **Movie Discovery & Catalog**: Explore currently running blockbusters and upcoming theatrical releases with genres, languages, runtimes, MPAA classifications, ratings, synopsis, and cast lists.
- **Auditorium & Showtime Schedules**: Browse schedules across multiple cinema locations (IMAX Laser, Dolby Cinema, VIP Velvet Lounge Suites).
- **Interactive Visual Seating Map**:
  - Curved illuminated screen indicator.
  - Multi-tiered seat layout: Standard, Premium, and VIP Recliner suites.
  - Real-time seat status visualization: Available, Selected, Booked, and Temporarily Held.
- **Server-Side Concurrency & Seat Locking**:
  - Atomic temporary holds (5-minute countdown) to prevent race conditions.
  - Double-booking prevention validated at the database layer before confirmation.
- **Booking & Ticket Management**:
  - Generates unique cinema booking references (e.g., `IM-7D9A2`).
  - Dynamic price breakdown: Subtotal, convenience fee, and entertainment tax.
  - Digital cinema pass with scannable QR representation and print capability.
- **Customer Dashboard**:
  - View upcoming and past booking history.
  - One-click cancellation with automated seat release (enforcing cutoff policy).
  - Profile and password management.
- **Administrator Dashboard**:
  - Operational KPIs: Total Revenue, Tickets Issued, Confirmed Bookings, and Scheduled Shows.
  - Movie catalog management (Create, Edit, Delete, Toggle Status).
  - Showtime scheduling with screen collision / overlap detection.
  - Comprehensive reservation ledger with search, filter, and refund controls.
  - User directory and quick 1-click database reseed utility.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express.js, REST API architecture.
- **Database & ODM**: MongoDB with Mongoose ODM (embedded `mongodb-memory-server` out-of-the-box or external MongoDB Atlas via `MONGODB_URI`).
- **Authentication**: JSON Web Tokens (JWT), bcryptjs password hashing, role-based authorization middleware.
- **Testing**: Automated integration test suite (`server/tests/run-tests.ts`).

---

## 3. Quick Start & Running the Project

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
```bash
# Clone or navigate to the project directory
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` (or configure your environment variables):
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=imovies_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:3000

# Optional: To connect to an external MongoDB instance or Atlas:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/imovies?retryWrites=true&w=majority
```
*Note: If `MONGODB_URI` is left blank, the application automatically boots a high-performance local embedded MongoDB instance via `mongodb-memory-server` with zero configuration required.*

### Running the Application

To start the full-stack server (Express API + Vite Dev Server on port 3000):
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Windows (VS Code) Execution
In VS Code on Windows:
1. Open the project folder in VS Code (`File > Open Folder...`).
2. Open the integrated terminal (`Ctrl + \`` or `Terminal > New Terminal`).
3. Run:
   ```powershell
   npm install
   npm run dev
   ```

---

## 4. Default Seed Accounts

The development database seeds automatically with sample cinema data and two ready-to-use accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@imovies.com` | `AdminPass123!` | Full admin console, catalog editing, showtimes, user management, reseed |
| **Customer** | `user@imovies.com` | `UserPass123!` | Ticket booking, seat selection, profile, booking history, cancellations |

*The login modal includes convenient 1-click test buttons to instantly sign in as either account.*

---

## 5. Automated Testing

To run the automated verification test suite:
```bash
npx tsx server/tests/run-tests.ts
```

The test suite validates:
1. Database connectivity and collection seeding.
2. Bcrypt password encryption and credential verification.
3. Duplicate email protection via unique Mongoose indexes.
4. Movie catalog queries, filters, and text search.
5. Showtime retrieval and initial seat layout status.
6. Temporary concurrency seat locking and conflict prevention.
7. Booking creation and persistence in MongoDB.
8. Double-booking prevention for identical seats.
9. Booking cancellation policy and immediate seat release.

---

## 6. REST API Summary

### Authentication
- `POST /api/auth/register` — Register a new customer account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Get current authenticated user profile
- `PUT /api/auth/profile` — Update account profile details
- `PUT /api/auth/change-password` — Securely change account password
- `POST /api/auth/logout` — Invalidate session

### Movies
- `GET /api/movies` — List movies (supports `search`, `genre`, `language`, `status`, `sort`, `page`)
- `GET /api/movies/:id` — Movie details with upcoming sessions and theatres
- `POST /api/movies` — (Admin) Add new movie
- `PUT /api/movies/:id` — (Admin) Update movie
- `DELETE /api/movies/:id` — (Admin) Delete movie and associated showtimes

### Theatres & Showtimes
- `GET /api/theatres` — List all cinema locations and screen auditoriums
- `GET /api/showtimes` — List scheduled showtimes (filters by `movie`, `theatre`, `date`)
- `GET /api/showtimes/:id` — Showtime details
- `POST /api/showtimes` — (Admin) Schedule a showtime (with screen overlap validation)
- `DELETE /api/showtimes/:id` — (Admin) Remove scheduled showtime

### Seats & Concurrency
- `GET /api/showtimes/:id/seats` — Get live seating map with booked/held indicators
- `POST /api/showtimes/:id/reserve-seats` — Atomically hold seats for 5 minutes
- `POST /api/showtimes/:id/release-seats` — Manually release held seats

### Bookings
- `POST /api/bookings` — Create and confirm booking (persists in MongoDB)
- `GET /api/bookings/my` — Retrieve authenticated user's bookings
- `GET /api/bookings/:id` — Retrieve specific booking pass
- `POST /api/bookings/:id/cancel` — Cancel booking and release seats

### Administration
- `GET /api/admin/stats` — Revenue, ticket volume, and occupancy metrics
- `GET /api/admin/bookings` — Search and manage all customer bookings
- `GET /api/admin/users` — Directory of registered accounts and booking counts
- `POST /api/admin/reseed` — Reset and repopulate database with fresh cinema data
