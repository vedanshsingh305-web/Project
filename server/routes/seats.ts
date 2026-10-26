import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Showtime } from '../models/Showtime.js';
import { Screen } from '../models/Screen.js';
import { Booking } from '../models/Booking.js';
import { SeatReservation } from '../models/SeatReservation.js';
import { optionalAuth, authenticate, AuthRequest } from '../middleware/auth.js';

export const seatsRouter = Router();

// GET /api/showtimes/:id/seats
seatsRouter.get('/showtimes/:id/seats', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const showtimeId = req.params.id;
    const showtime = await Showtime.findById(showtimeId).populate('screen').populate('theatre').populate('movie');
    if (!showtime) {
      res.status(404).json({ success: false, message: 'Showtime not found.' });
      return;
    }

    const screen = await Screen.findById(showtime.screen);
    if (!screen) {
      res.status(404).json({ success: false, message: 'Screen layout not found.' });
      return;
    }

    const now = new Date();
    const currentUserId = req.user?.userId;
    const sessionId = (req.headers['x-session-id'] as string) || '';

    // 1. Get all CONFIRMED booked seats for this showtime
    const confirmedBookings = await Booking.find({
      showtime: showtime._id,
      bookingStatus: 'CONFIRMED',
    }).select('seats');

    const bookedSeatIds = new Set<string>();
    confirmedBookings.forEach((b) => {
      b.seats.forEach((s) => bookedSeatIds.add(s.seatId));
    });

    // 2. Get all currently active held reservations
    const activeReservations = await SeatReservation.find({
      showtime: showtime._id,
      status: 'held',
      expiresAt: { $gt: now },
    });

    const heldByOtherIds = new Set<string>();
    const heldByCurrentUserIds = new Set<string>();
    let userExpiresAt: Date | null = null;

    activeReservations.forEach((r) => {
      const isMine =
        (currentUserId && r.userId && r.userId.toString() === currentUserId) ||
        (sessionId && r.sessionId === sessionId);

      if (isMine) {
        heldByCurrentUserIds.add(r.seatId);
        if (!userExpiresAt || r.expiresAt > userExpiresAt) {
          userExpiresAt = r.expiresAt;
        }
      } else {
        heldByOtherIds.add(r.seatId);
      }
    });

    // Decorate seats with live status and current pricing
    const decoratedSeats = screen.seats.map((seat) => {
      let status: 'available' | 'booked' | 'held_by_other' | 'held_by_you' = 'available';

      if (bookedSeatIds.has(seat.seatId)) {
        status = 'booked';
      } else if (heldByOtherIds.has(seat.seatId)) {
        status = 'held_by_other';
      } else if (heldByCurrentUserIds.has(seat.seatId)) {
        status = 'held_by_you';
      }

      // Calculate exact price based on showtime tier pricing
      let price = showtime.basePrice;
      if (seat.category === 'vip') {
        price = showtime.pricing.vip;
      } else if (seat.category === 'premium') {
        price = showtime.pricing.premium;
      } else {
        price = showtime.pricing.standard;
      }

      return {
        ...seat,
        status,
        price,
      };
    });

    res.json({
      success: true,
      data: {
        showtime: {
          id: showtime._id,
          startTime: showtime.startTime,
          endTime: showtime.endTime,
          basePrice: showtime.basePrice,
          pricing: showtime.pricing,
          movie: showtime.movie,
          theatre: showtime.theatre,
        },
        screen: {
          id: screen._id,
          name: screen.name,
          screenType: screen.screenType,
          rows: screen.rows,
          seatsPerRow: screen.seatsPerRow,
          totalSeats: screen.totalSeats,
        },
        seats: decoratedSeats,
        myHeldSeats: Array.from(heldByCurrentUserIds),
        reservationExpiresAt: userExpiresAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching seat layout.' });
  }
});

// POST /api/showtimes/:id/reserve-seats (Hold seats for 5 minutes)
seatsRouter.post('/showtimes/:id/reserve-seats', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const showtimeId = req.params.id;
    const { seatIds, sessionId: clientSessionId } = req.body;

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      res.status(400).json({ success: false, message: 'Please select at least one seat to reserve.' });
      return;
    }

    if (seatIds.length > 8) {
      res.status(400).json({ success: false, message: 'Maximum 8 seats can be reserved in a single transaction.' });
      return;
    }

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime || !showtime.active || showtime.status !== 'scheduled') {
      res.status(404).json({ success: false, message: 'Showtime is not available for booking.' });
      return;
    }

    const now = new Date();
    const currentUserId = req.user?.userId;
    const sessionId = (req.headers['x-session-id'] as string) || clientSessionId || '';

    // 1. Check if any seat is already CONFIRMED booked
    const conflictBooking = await Booking.findOne({
      showtime: showtime._id,
      bookingStatus: 'CONFIRMED',
      'seats.seatId': { $in: seatIds },
    });

    if (conflictBooking) {
      const bookedSeats = conflictBooking.seats.filter((s) => seatIds.includes(s.seatId)).map((s) => s.seatId);
      res.status(409).json({
        success: false,
        message: `Seats [${bookedSeats.join(', ')}] are already booked. Please choose other seats.`,
        conflictingSeats: bookedSeats,
      });
      return;
    }

    // 2. Check if any seat is currently held by ANOTHER customer
    const conflictReservationQuery: any = {
      showtime: showtime._id,
      seatId: { $in: seatIds },
      status: 'held',
      expiresAt: { $gt: now },
    };

    if (currentUserId) {
      conflictReservationQuery.userId = { $ne: new mongoose.Types.ObjectId(currentUserId) };
    } else if (sessionId) {
      conflictReservationQuery.sessionId = { $ne: sessionId };
    }

    const conflictReservation = await SeatReservation.findOne(conflictReservationQuery);
    if (conflictReservation) {
      res.status(409).json({
        success: false,
        message: `Seat ${conflictReservation.seatId} is currently held by another customer. Please select different seats.`,
        conflictingSeats: [conflictReservation.seatId],
      });
      return;
    }

    // 3. Clear existing active holds for THIS user on THIS showtime
    const userClearQuery: any = {
      showtime: showtime._id,
      status: 'held',
    };
    if (currentUserId) {
      userClearQuery.userId = currentUserId;
    } else if (sessionId) {
      userClearQuery.sessionId = sessionId;
    }
    await SeatReservation.deleteMany(userClearQuery);

    // 4. Create new 5-minute hold records
    const holdDurationMinutes = 5;
    const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);

    const reservations = seatIds.map((seatId) => ({
      showtime: showtime._id,
      seatId,
      userId: currentUserId || new mongoose.Types.ObjectId(),
      sessionId: sessionId || '',
      expiresAt,
      status: 'held',
    }));

    await SeatReservation.insertMany(reservations);

    res.json({
      success: true,
      message: `${seatIds.length} seat(s) held for ${holdDurationMinutes} minutes.`,
      heldSeats: seatIds,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Seat reservation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error holding seats.' });
  }
});

// POST /api/showtimes/:id/release-seats
seatsRouter.post('/showtimes/:id/release-seats', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const showtimeId = req.params.id;
    const currentUserId = req.user?.userId;
    const sessionId = (req.headers['x-session-id'] as string) || req.body.sessionId || '';

    const query: any = { showtime: showtimeId, status: 'held' };
    if (currentUserId) {
      query.userId = currentUserId;
    } else if (sessionId) {
      query.sessionId = sessionId;
    }

    await SeatReservation.deleteMany(query);
    res.json({ success: true, message: 'Held seats released.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error releasing seats.' });
  }
});
