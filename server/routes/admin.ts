import { Router, Response } from 'express';
import { Movie } from '../models/Movie.js';
import { Theatre } from '../models/Theatre.js';
import { Screen } from '../models/Screen.js';
import { Showtime } from '../models/Showtime.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import { seedDatabase } from '../db/seed.js';

export const adminRouter = Router();

// Apply requireAdmin to all admin endpoints
adminRouter.use(requireAdmin);

// GET /api/admin/stats
adminRouter.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalMovies,
      totalTheatres,
      totalScreens,
      totalShowtimes,
      totalUsers,
      totalBookings,
      confirmedBookings,
      allConfirmed,
    ] = await Promise.all([
      Movie.countDocuments({ active: true }),
      Theatre.countDocuments({ active: true }),
      Screen.countDocuments({ active: true }),
      Showtime.countDocuments({ status: 'scheduled', startTime: { $gte: new Date() } }),
      User.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'CONFIRMED' }),
      Booking.find({ bookingStatus: 'CONFIRMED' }).select('totalAmount seats'),
    ]);

    const totalRevenue = allConfirmed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalTicketsSold = allConfirmed.reduce((sum, b) => sum + (b.seats ? b.seats.length : 0), 0);

    // Recent 5 bookings
    const recentBookings = await Booking.find()
      .populate('movie', 'title posterUrl')
      .populate('theatre', 'name city')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalMovies,
        totalTheatres,
        totalScreens,
        upcomingShowtimes: totalShowtimes,
        totalUsers,
        totalBookings,
        confirmedBookings,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTicketsSold,
        recentBookings,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching admin stats.' });
  }
});

// GET /api/admin/bookings
adminRouter.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status && status !== 'ALL') {
      query.bookingStatus = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { bookingReference: reg },
        { customerName: reg },
        { customerEmail: reg },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('movie', 'title posterUrl')
        .populate('theatre', 'name city')
        .populate('screen', 'name screenType')
        .populate('showtime', 'startTime endTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: bookings,
      meta: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching bookings.' });
  }
});

// GET /api/admin/users
adminRouter.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Aggregate booking count per user
    const userStats = await Promise.all(
      users.map(async (u) => {
        const bookingCount = await Booking.countDocuments({ user: u._id });
        return {
          ...u.toObject(),
          bookingCount,
        };
      })
    );

    res.json({ success: true, data: userStats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching users.' });
  }
});

// POST /api/admin/reseed
adminRouter.post('/reseed', async (_req: AuthRequest, res: Response) => {
  try {
    await seedDatabase(true);
    res.json({ success: true, message: 'Database reset and reseeded with default cinema data successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to reseed database.' });
  }
});
