import { Router, Request, Response } from 'express';
import { Showtime } from '../models/Showtime.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';

export const showtimesRouter = Router();

// GET /api/showtimes
showtimesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { movie, theatre, date } = req.query;
    const query: any = { active: true, status: 'scheduled' };

    if (movie) query.movie = movie;
    if (theatre) query.theatre = theatre;

    if (date && typeof date === 'string') {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // By default show upcoming from now
      query.startTime = { $gte: new Date(Date.now() - 30 * 60 * 1000) };
    }

    const showtimes = await Showtime.find(query)
      .populate('movie')
      .populate('theatre')
      .populate('screen')
      .sort({ startTime: 1 });

    res.json({ success: true, data: showtimes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching showtimes.' });
  }
});

// GET /api/showtimes/:id
showtimesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movie')
      .populate('theatre')
      .populate('screen');

    if (!showtime) {
      res.status(404).json({ success: false, message: 'Showtime not found.' });
      return;
    }

    res.json({ success: true, data: showtime });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching showtime.' });
  }
});

// POST /api/showtimes (Admin only, with overlap detection)
showtimesRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { movie, theatre, screen, startTime, endTime, pricing, basePrice } = req.body;

    if (!movie || !theatre || !screen || !startTime || !endTime) {
      res.status(400).json({ success: false, message: 'Movie, theatre, screen, startTime, and endTime are required.' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      res.status(400).json({ success: false, message: 'Start time must be before end time.' });
      return;
    }

    // Schedule overlap prevention on the same screen:
    // (Existing.start < New.end) AND (Existing.end > New.start)
    const overlapping = await Showtime.findOne({
      screen,
      status: 'scheduled',
      active: true,
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } },
      ],
    });

    if (overlapping) {
      res.status(409).json({
        success: false,
        message: 'Schedule conflict detected. Another showtime is already scheduled on this screen during the requested time window.',
        conflict: overlapping,
      });
      return;
    }

    const showtime = await Showtime.create({
      movie,
      theatre,
      screen,
      startTime: start,
      endTime: end,
      basePrice: basePrice || 15.0,
      pricing: pricing || {
        standard: basePrice || 15.0,
        premium: (basePrice || 15.0) * 1.3,
        vip: (basePrice || 15.0) * 1.7,
      },
      status: 'scheduled',
      active: true,
    });

    const populated = await Showtime.findById(showtime._id)
      .populate('movie')
      .populate('theatre')
      .populate('screen');

    res.status(201).json({ success: true, data: populated, message: 'Showtime created successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create showtime.' });
  }
});

// PUT /api/showtimes/:id (Admin only)
showtimesRouter.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Showtime.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('movie')
      .populate('theatre')
      .populate('screen');

    if (!updated) {
      res.status(404).json({ success: false, message: 'Showtime not found.' });
      return;
    }

    res.json({ success: true, data: updated, message: 'Showtime updated successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update showtime.' });
  }
});

// DELETE /api/showtimes/:id (Admin only)
showtimesRouter.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Showtime.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Showtime not found.' });
      return;
    }
    res.json({ success: true, message: 'Showtime deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete showtime.' });
  }
});
