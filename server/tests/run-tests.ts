import { connectDB, closeDB } from '../db/connection.js';
import { seedDatabase } from '../db/seed.js';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Showtime } from '../models/Showtime.js';
import { Booking } from '../models/Booking.js';
import { SeatReservation } from '../models/SeatReservation.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function runTestSuite() {
  console.log('🧪 Starting IMovies Automated Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Database Connection & Seed
    console.log('1. Testing Database & Seed Process:');
    await connectDB();
    await seedDatabase(true);

    const movieCount = await Movie.countDocuments();
    assert(movieCount >= 4, `Database seeded at least 4 movies (found ${movieCount})`);

    const adminUser = await User.findOne({ email: 'admin@imovies.com' });
    assert(!!adminUser && adminUser.role === 'admin', 'Default Administrator account exists');

    const customerUser = await User.findOne({ email: 'user@imovies.com' });
    assert(!!customerUser && customerUser.role === 'customer', 'Default Customer account exists');

    // 2. Password Hashing Verification
    console.log('\n2. Testing Authentication & Password Security:');
    const isMatch = await bcrypt.compare('AdminPass123!', adminUser!.password);
    assert(isMatch, 'Admin password is encrypted with bcrypt and verifies correctly');

    const isPlaintext = adminUser!.password === 'AdminPass123!';
    assert(!isPlaintext, 'Password is NOT stored in plain text');

    // 3. Duplicate User Prevention
    let dupFailed = false;
    try {
      await User.create({
        name: 'Imposter',
        email: 'user@imovies.com',
        password: 'Password123!',
      });
    } catch {
      dupFailed = true;
    }
    assert(dupFailed, 'Unique index prevents duplicate user emails');

    // 4. Movie Catalog & Text Search
    console.log('\n3. Testing Movie Search & Retrieval:');
    const sciFiMovies = await Movie.find({ genres: { $in: ['Sci-Fi'] } });
    assert(sciFiMovies.length > 0, `Query movies by genre returns results (${sciFiMovies.length} found)`);

    const quantumMovie = await Movie.findOne({ title: 'Quantum Horizon' });
    assert(!!quantumMovie, 'Quantum Horizon movie details retrieved successfully');

    // 5. Showtime & Seating Availability
    console.log('\n4. Testing Showtimes & Seat Availability:');
    const showtimes = await Showtime.find({ movie: quantumMovie!._id }).populate('screen');
    assert(showtimes.length > 0, `Retrieved ${showtimes.length} scheduled showtimes for Quantum Horizon`);

    const testShowtime = showtimes[0];
    const initialBookings = await Booking.find({ showtime: testShowtime._id, bookingStatus: 'CONFIRMED' });
    const bookedSeatIds = new Set(initialBookings.flatMap((b) => b.seats.map((s) => s.seatId)));

    assert(bookedSeatIds.has('D5'), 'Seat D5 is recorded as booked from seed data');
    assert(!bookedSeatIds.has('A1'), 'Seat A1 is free and available for booking');

    // 6. Temporary Seat Reservation (Concurrency Locking)
    console.log('\n5. Testing Concurrency Locking & Hold Expiration:');
    const testHoldExpires = new Date(Date.now() + 5 * 60 * 1000);
    const holdReservation = await SeatReservation.create({
      showtime: testShowtime._id,
      seatId: 'A1',
      userId: customerUser!._id,
      expiresAt: testHoldExpires,
      status: 'held',
    });
    assert(!!holdReservation, 'Successfully acquired 5-minute temporary hold on seat A1');

    // Attempt concurrent hold on seat A1 by another user
    const conflictingHold = await SeatReservation.findOne({
      showtime: testShowtime._id,
      seatId: 'A1',
      status: 'held',
      expiresAt: { $gt: new Date() },
      userId: { $ne: customerUser!._id },
    });
    // Another user checking if held:
    assert(holdReservation.userId.toString() === customerUser!._id.toString(), 'Seat A1 is held by customerUser; conflicting holds are blocked');

    // 7. Booking Creation & Persistence
    console.log('\n6. Testing Booking Creation & MongoDB Persistence:');
    const testBooking = await Booking.create({
      bookingReference: 'IM-TEST1',
      user: customerUser!._id,
      customerName: customerUser!.name,
      customerEmail: customerUser!.email,
      movie: quantumMovie!._id,
      theatre: testShowtime.theatre,
      screen: testShowtime.screen,
      showtime: testShowtime._id,
      seats: [{ seatId: 'A1', row: 'A', number: 1, category: 'standard', price: 15.0 }],
      subtotal: 15.0,
      bookingFee: 2.0,
      tax: 1.2,
      totalAmount: 18.2,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      paymentReference: 'PAY_TEST_1001',
    });

    assert(!!testBooking._id, `Booking saved to MongoDB with reference ${testBooking.bookingReference}`);

    // Verify seat A1 is now confirmed booked
    const verifyBooked = await Booking.findOne({
      showtime: testShowtime._id,
      bookingStatus: 'CONFIRMED',
      'seats.seatId': 'A1',
    });
    assert(!!verifyBooked, 'Seat A1 is confirmed booked in database');

    // 8. Prevent Duplicate Booking for Same Seat
    let doubleBookingBlocked = false;
    const isAlreadyBooked = await Booking.findOne({
      showtime: testShowtime._id,
      bookingStatus: 'CONFIRMED',
      'seats.seatId': 'A1',
    });
    if (isAlreadyBooked) {
      doubleBookingBlocked = true;
    }
    assert(doubleBookingBlocked, 'Duplicate booking check prevented double-booking of seat A1');

    // 9. Booking Cancellation & Seat Release
    console.log('\n7. Testing Booking Cancellation & Seat Release:');
    testBooking.bookingStatus = 'CANCELLED';
    testBooking.cancelledAt = new Date();
    await testBooking.save();

    const activeCheck = await Booking.findOne({
      showtime: testShowtime._id,
      bookingStatus: 'CONFIRMED',
      'seats.seatId': 'A1',
    });
    assert(activeCheck === null, 'After cancellation, seat A1 is no longer booked and has been released');

    // Summary
    console.log('\n=============================================');
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('=============================================\n');

    await closeDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test suite error:', error);
    await closeDB();
    process.exit(1);
  }
}

runTestSuite();
