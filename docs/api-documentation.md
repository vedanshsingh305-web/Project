# IMovies REST API Reference

Base URL: `/api`

All protected endpoints require an `Authorization: Bearer <token>` header obtained from `/api/auth/login` or `/api/auth/register`.

---

### Authentication

#### 1. Register User
- **POST** `/api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "phone": "+1 555-0192"
  }
  ```
- **Response**: `201 Created` with JWT token and user profile.

#### 2. Login User
- **POST** `/api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response**: `200 OK` with JWT token and user profile.

#### 3. Current User Profile
- **GET** `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

### Movies

#### 1. List Movies
- **GET** `/api/movies`
- **Query Parameters**:
  - `search`: Case-insensitive text filter.
  - `genre`: e.g. `Action`, `Sci-Fi`.
  - `language`: e.g. `English`.
  - `status`: `now_showing` or `upcoming`.
  - `sort`: `rating`, `title`, `releaseDate`, `popular`.
  - `page`: Page index (default: `1`).
  - `limit`: Items per page (default: `12`).

#### 2. Movie Details
- **GET** `/api/movies/:id`
- **Response**: Full movie object with scheduled upcoming showtimes across auditoriums.

#### 3. Create Movie (Admin Only)
- **POST** `/api/movies`
- **Headers**: `Authorization: Bearer <admin_token>`

#### 4. Delete Movie (Admin Only)
- **DELETE** `/api/movies/:id`

---

### Seats & Concurrency Locks

#### 1. Get Live Seating Layout
- **GET** `/api/showtimes/:id/seats`
- **Headers**: Optional `Authorization: Bearer <token>` and `x-session-id: <session_id>`
- **Response**: Screen structure, seat statuses (`available`, `selected`, `booked`, `held_by_other`, `held_by_you`), and remaining hold time.

#### 2. Atomically Reserve / Hold Seats
- **POST** `/api/showtimes/:id/reserve-seats`
- **Request Body**:
  ```json
  {
    "seatIds": ["D5", "D6"]
  }
  ```
- **Response**: `200 OK` with `expiresAt` (5 minutes from request), or `409 Conflict` if any seat is already booked or held by another guest.

#### 3. Release Seats
- **POST** `/api/showtimes/:id/release-seats`

---

### Bookings

#### 1. Confirm and Commit Booking
- **POST** `/api/bookings`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "showtimeId": "65b...",
    "seatIds": ["D5", "D6"],
    "customerName": "Jane Doe",
    "customerEmail": "jane@example.com",
    "paymentMethod": "CARD"
  }
  ```
- **Response**: `201 Created` with full persisted booking object and unique `bookingReference`.

#### 2. Customer Booking History
- **GET** `/api/bookings/my`

#### 3. Cancel Booking
- **POST** `/api/bookings/:id/cancel`
- **Request Body**: `{ "reason": "Customer changed schedule" }`
- **Validation**: Enforces 60-minute cutoff prior to showtime. Immediately releases seats back into circulation.

---

### Admin Operations

- **GET** `/api/admin/stats` — Revenue, ticket turnover, and occupancy stats.
- **GET** `/api/admin/bookings` — Search and manage all system bookings.
- **GET** `/api/admin/users` — Registered users directory and booking counts.
- **POST** `/api/admin/reseed` — Reset and reseed test database.
