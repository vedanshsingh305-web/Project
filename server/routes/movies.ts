import { Router, Request, Response } from 'express';
import { Movie } from '../models/Movie.js';
import { Showtime } from '../models/Showtime.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';

export const moviesRouter = Router();

// GET /api/movies
moviesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      genre,
      language,
      status,
      sort = 'rating',
      page = 1,
      limit = 12,
    } = req.query;

    const query: any = { active: true };

    if (status && (status === 'now_showing' || status === 'upcoming')) {
      query.releaseStatus = status;
    }

    if (genre && genre !== 'All') {
      query.genres = { $in: [genre] };
    }

    if (language && language !== 'All') {
      query.language = new RegExp(`^${language}`, 'i');
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { director: searchRegex },
        { cast: searchRegex },
        { genres: searchRegex },
      ];
    }

    let sortOptions: any = { rating: -1 };
    if (sort === 'title') {
      sortOptions = { title: 1 };
    } else if (sort === 'releaseDate') {
      sortOptions = { releaseDate: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1 };
    } else if (sort === 'popular') {
      sortOptions = { featured: -1, rating: -1 };
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Movie.countDocuments(query),
    ]);

    // Also get all distinct genres and languages for filter dropdowns
    const [allGenres, allLanguages] = await Promise.all([
      Movie.distinct('genres', { active: true }),
      Movie.distinct('language', { active: true }),
    ]);

    res.json({
      success: true,
      data: movies,
      meta: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        genres: allGenres,
        languages: allLanguages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching movies.' });
  }
});

// GET /api/movies/:id
moviesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404).json({ success: false, message: 'Movie not found.' });
      return;
    }

    // Find upcoming showtimes for this movie
    const upcomingShowtimes = await Showtime.find({
      movie: movie._id,
      startTime: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // allow shows started up to 30 min ago
      status: 'scheduled',
      active: true,
    })
      .populate('theatre')
      .populate('screen')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: {
        movie,
        showtimes: upcomingShowtimes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching movie.' });
  }
});

// POST /api/movies (Admin only)
moviesRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json({ success: true, data: movie, message: 'Movie created successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create movie.' });
  }
});

// PUT /api/movies/:id (Admin only)
moviesRouter.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Movie not found.' });
      return;
    }
    res.json({ success: true, data: updated, message: 'Movie updated successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update movie.' });
  }
});

// DELETE /api/movies/:id (Admin only)
moviesRouter.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await Movie.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Movie not found.' });
      return;
    }
    // Also remove associated showtimes
    await Showtime.deleteMany({ movie: deleted._id });
    res.json({ success: true, message: 'Movie and associated showtimes removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete movie.' });
  }
});
