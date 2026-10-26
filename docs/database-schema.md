# IMovies MongoDB Schema Documentation

## 1. User Collection
- `name` (String, required)
- `email` (String, required, unique, lowercase)
- `password` (String, bcrypt hashed, omitted in JSON output)
- `role` (String, enum: `['customer', 'admin']`, default: `'customer'`)
- `phone` (String, optional)
- Timestamps: `createdAt`, `updatedAt`

## 2. Movie Collection
- `title` (String, required, indexed)
- `description` (String, required)
- `genres` (Array of Strings, indexed)
- `language` (String, required)
- `duration` (Number, minutes)
- `releaseDate` (Date, required)
- `releaseStatus` (String, enum: `['now_showing', 'upcoming']`)
- `rating` (Number, 0.0 to 10.0)
- `ageClassification` (String, e.g. `'PG-13'`, `'R'`)
- `director` (String)
- `cast` (Array of Strings)
- `posterUrl` (String)
- `backdropUrl` (String)
- `trailerUrl` (String, optional)
- `featured` (Boolean, default: `false`)
- `active` (Boolean, default: `true`)
- Indexes: Text index across `title`, `description`, `genres`, and `director` with `language_override: 'searchLanguage'`.

## 3. Theatre Collection
- `name` (String, required)
- `address` (String, required)
- `city` (String, required, indexed)
- `contactPhone` (String)
- `facilities` (Array of Strings, e.g. `['Dolby Atmos', 'IMAX 3D', 'VIP Dining']`)
- `active` (Boolean, default: `true`)

## 4. Screen Collection
- `theatre` (ObjectId ref Theatre, required, indexed)
- `screenNumber` (Number, required)
- `name` (String, required)
- `screenType` (String, enum: `['Standard', 'IMAX 3D', 'Dolby Cinema', 'VIP Lounge']`)
- `rows` (Array of Strings, e.g. `['A', 'B', 'C', 'D', 'E', 'F', 'G']`)
- `seatsPerRow` (Number, default: 10)
- `seats` (Array of SeatDefinitions: `{ seatId, row, number, category, priceMultiplier }`)
- `totalSeats` (Number)
- `active` (Boolean)
- Unique Index: `{ theatre: 1, screenNumber: 1 }`

## 5. Showtime Collection
- `movie` (ObjectId ref Movie, required, indexed)
- `theatre` (ObjectId ref Theatre, required, indexed)
- `screen` (ObjectId ref Screen, required, indexed)
- `startTime` (Date, required, indexed)
- `endTime` (Date, required, indexed)
- `basePrice` (Number, default: 15.0)
- `pricing` (`{ standard: Number, premium: Number, vip: Number }`)
- `status` (String, enum: `['scheduled', 'cancelled', 'completed']`)
- `cancellationCutoffMinutes` (Number, default: 60)
- `active` (Boolean)
- Compound Indexes: `{ movie: 1, startTime: 1 }`, `{ theatre: 1, startTime: 1 }`, `{ screen: 1, startTime: 1, endTime: 1 }`

## 6. SeatReservation Collection (Concurrency Lock)
- `showtime` (ObjectId ref Showtime, required, indexed)
- `seatId` (String, e.g. `"C5"`, required)
- `userId` (ObjectId ref User, required)
- `sessionId` (String)
- `expiresAt` (Date, required, TTL index with `expireAfterSeconds: 900`)
- `status` (String, enum: `['held', 'confirmed', 'released']`, default: `'held'`)
- Compound Index: `{ showtime: 1, seatId: 1, status: 1 }`

## 7. Booking Collection
- `bookingReference` (String, unique uppercase e.g. `"IM-8F29A"`, indexed)
- `user` (ObjectId ref User, required, indexed)
- `customerName` (String, required)
- `customerEmail` (String, required)
- `customerPhone` (String)
- `movie` (ObjectId ref Movie, required, indexed)
- `theatre` (ObjectId ref Theatre, required, indexed)
- `screen` (ObjectId ref Screen, required, indexed)
- `showtime` (ObjectId ref Showtime, required, indexed)
- `seats` (Array of `{ seatId, row, number, category, price }`)
- `subtotal` (Number, required)
- `bookingFee` (Number, default: 2.0)
- `tax` (Number, default: 8%)
- `totalAmount` (Number, required)
- `bookingStatus` (String, enum: `['CONFIRMED', 'CANCELLED', 'PENDING']`)
- `paymentStatus` (String, enum: `['PAID', 'PENDING', 'REFUNDED']`)
- `paymentMethod` (String, e.g. `'CARD'`)
- `paymentReference` (String)
- `cancelledAt` (Date, optional)
- `cancellationReason` (String, optional)
- Timestamps: `createdAt`, `updatedAt`
- Compound Indexes: `{ user: 1, createdAt: -1 }`, `{ showtime: 1, bookingStatus: 1 }`
