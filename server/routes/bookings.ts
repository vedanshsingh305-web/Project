import { Router, Response } from 'express';
import { Booking, IBookedSeat } from '../models/Booking.js';
import { Showtime } from '../models/Showtime.js';
import { Screen } from '../models/Screen.js';
import { SeatReservation } from '../models/SeatReservation.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

export const bookingsRouter = Router();

// Generate unique booking reference e.g. IM-8K42P
function generateBookingRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'IM-';
  for (let i = 0; i < 5; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// POST /api/bookings (Create & Confirm Booking)
bookingsRouter.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      showtimeId,
      seatIds,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod = 'CARD',
    } = req.body;

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
      res.status(400).json({ success: false, message: 'Showtime ID and at least one seat are required.' });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const showtime = await Showtime.findById(showtimeId).populate('movie').populate('theatre').populate('screen');
    if (!showtime || !showtime.active || showtime.status !== 'scheduled') {
      res.status(404).json({ success: false, message: 'Showtime not found or not active.' });
      return;
    }

    const screen = await Screen.findById(showtime.screen);
    if (!screen) {
      res.status(404).json({ success: false, message: 'Screen layout not found.' });
      return;
    }

    // Double-check: are any of these seats already booked in a CONFIRMED booking?
    const existingBooking = await Booking.findOne({
      showtime: showtime._id,
      bookingStatus: 'CONFIRMED',
      'seats.seatId': { $in: seatIds },
    });

    if (existingBooking) {
      const taken = existingBooking.seats.filter((s) => seatIds.includes(s.seatId)).map((s) => s.seatId);
      res.status(409).json({
        success: false,
        message: `Seats [${taken.join(', ')}] are already confirmed booked by another guest.`,
        takenSeats: taken,
      });
      return;
    }

    // Check if any seat is held by someone ELSE
    const now = new Date();
    const otherHold = await SeatReservation.findOne({
      showtime: showtime._id,
      seatId: { $in: seatIds },
      status: 'held',
      expiresAt: { $gt: now },
      userId: { $ne: userId },
    });

    if (otherHold) {
      res.status(409).json({
        success: false,
        message: `Seat ${otherHold.seatId} is currently reserved by another customer.`,
      });
      return;
    }

    // Build seats array with exact price
    const bookedSeats: IBookedSeat[] = [];
    let subtotal = 0;

    for (const seatId of seatIds) {
      const seatDef = screen.seats.find((s) => s.seatId === seatId);
      if (!seatDef) {
        res.status(400).json({ success: false, message: `Seat ${seatId} does not exist on this screen.` });
        return;
      }

      let price = showtime.basePrice;
      if (seatDef.category === 'vip') {
        price = showtime.pricing.vip;
      } else if (seatDef.category === 'premium') {
        price = showtime.pricing.premium;
      } else {
        price = showtime.pricing.standard;
      }

      bookedSeats.push({
        seatId: seatDef.seatId,
        row: seatDef.row,
        number: seatDef.number,
        category: seatDef.category,
        price,
      });
      subtotal += price;
    }

    const bookingFee = 2.0;
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% sales tax
    const totalAmount = Math.round((subtotal + bookingFee + tax) * 100) / 100;

    // Ensure unique booking reference
    let bookingReference = generateBookingRef();
    let collision = await Booking.findOne({ bookingReference });
    while (collision) {
      bookingReference = generateBookingRef();
      collision = await Booking.findOne({ bookingReference });
    }

    const mockPaymentRef = `PAY_SANDBOX_${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking = await Booking.create({
      bookingReference,
      user: userId,
      customerName: customerName || req.user?.name || 'Customer',
      customerEmail: customerEmail || req.user?.email || 'customer@imovies.com',
      customerPhone: customerPhone || '',
      movie: showtime.movie._id,
      theatre: showtime.theatre._id,
      screen: screen._id,
      showtime: showtime._id,
      seats: bookedSeats,
      subtotal,
      bookingFee,
      tax,
      totalAmount,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod,
      paymentReference: mockPaymentRef,
    });

    // Remove any held reservations for these seats since they are now confirmed
    await SeatReservation.deleteMany({
      showtime: showtime._id,
      seatId: { $in: seatIds },
    });

    const populated = await Booking.findById(newBooking._id)
      .populate('movie')
      .populate('theatre')
      .populate('screen')
      .populate('showtime');

    res.status(201).json({
      success: true,
      message: 'Tickets booked successfully!',
      data: populated,
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: error.message || 'Error processing booking.' });
  }
});

// GET /api/bookings/my (Customer's own bookings)
bookingsRouter.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ user: req.user?.userId })
      .populate('movie')
      .populate('theatre')
      .populate('screen')
      .populate('showtime')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching bookings.' });
  }
});

// GET /api/bookings/:id
bookingsRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('movie')
      .populate('theatre')
      .populate('screen')
      .populate('showtime');

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    // Ensure only the owner or an admin can view this booking
    if (booking.user.toString() !== req.user?.userId && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden. You do not own this booking.' });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching booking.' });
  }
});

// POST /api/bookings/:id/cancel
bookingsRouter.post('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { reason = 'Cancelled by customer' } = req.body;
    const booking = await Booking.findById(req.params.id).populate('showtime');

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    // Ownership or admin check
    if (booking.user.toString() !== req.user?.userId && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden. You cannot cancel this booking.' });
      return;
    }

    if (booking.bookingStatus === 'CANCELLED') {
      res.status(400).json({ success: false, message: 'This booking has already been cancelled.' });
      return;
    }

    // Check cancellation cutoff (must be at least 60 minutes before showtime starts, unless admin)
    const showtime = booking.showtime as any;
    if (showtime && showtime.startTime && req.user?.role !== 'admin') {
      const showtimeDate = new Date(showtime.startTime);
      const minutesUntilShow = (showtimeDate.getTime() - Date.now()) / (1000 * 60);

      const cutoff = showtime.cancellationCutoffMinutes || 60;
      if (minutesUntilShow < cutoff) {
        res.status(400).json({
          success: false,
          message: `Bookings can only be cancelled at least ${cutoff} minutes before showtime. This show starts in ${Math.max(0, Math.round(minutesUntilShow))} minutes.`,
        });
        return;
      }
    }

    booking.bookingStatus = 'CANCELLED';
    booking.paymentStatus = 'REFUNDED';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Seats have been released and refund initiated.',
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error cancelling booking.' });
  }
});
