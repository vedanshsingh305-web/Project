# IMovies System Architecture

## Overview
IMovies is a full-stack, distributed-ready cinema ticketing system designed to prevent race conditions during high-demand movie bookings.

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   (Tailwind CSS, Lucide Icons, Canvas Confetti)        │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼────────────────────────────┐
│                  Express.js Web Server                 │
│                                                        │
│  ├── Authentication & RBAC Middleware                  │
│  ├── Concurrency Lock & Reservation Controller         │
│  ├── Movie Catalog & Schedule Query Engine             │
│  └── Booking Lifecycle & Cancellation Service          │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM
┌───────────────────────────▼────────────────────────────┐
│                    MongoDB Database                    │
│                                                        │
│  ├── Users (Hashed Passwords, RBAC Roles)              │
│  ├── Movies (Text Search, Multi-Genre)                 │
│  ├── Theatres & Screens (Auditorium Seat Layouts)      │
│  ├── Showtimes (Timing, Screen Conflicts)              │
│  ├── SeatReservations (5m TTL Concurrency Locks)       │
│  └── Bookings (Persistent Passes, Unique Refs)         │
└────────────────────────────────────────────────────────┘
```

## Concurrency & Seat Locking Architecture

### 1. Temporary Hold Phase
When a user selects seats on the interactive map:
1. The client issues a `POST /api/showtimes/:id/reserve-seats` request.
2. The server verifies that no requested seat is already confirmed booked (`Booking` collection with `bookingStatus: 'CONFIRMED'`).
3. The server checks that no requested seat is currently held by another user (`SeatReservation` collection with `expiresAt > Date.now()` and `status: 'held'`).
4. If clear, the server issues a 5-minute reservation hold document for each seat with an indexed TTL.
5. Other concurrent users attempting to hold or book the same seat receive an immediate `409 Conflict` error and are prompted to choose another seat.

### 2. Confirmation & Commit Phase
1. When the user confirms payment, the server re-validates the seats atomically.
2. The server generates a collision-free `bookingReference` (e.g. `IM-9F24B`).
3. The booking record is persisted to MongoDB.
4. Active temporary hold documents for the booked seats are resolved so the seats transition permanently to confirmed status.
5. The confirmed seats are excluded from future showtime availability queries.

### 3. Cancellation Policy & Automated Seat Release
1. Customers can cancel bookings up to 60 minutes prior to scheduled showtime.
2. Administrators can cancel bookings at any time.
3. Upon cancellation, the booking status transitions to `CANCELLED` and `paymentStatus` to `REFUNDED`.
4. The seats are immediately released back to the general availability pool for that specific showtime only.
