import { Router, Request, Response } from 'express';
import { Theatre } from '../models/Theatre.js';
import { Screen, ISeatDefinition } from '../models/Screen.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';

export const theatresRouter = Router();

// GET /api/theatres
theatresRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const theatres = await Theatre.find({ active: true }).sort({ name: 1 });
    const theatresWithScreens = await Promise.all(
      theatres.map(async (th) => {
        const screens = await Screen.find({ theatre: th._id, active: true }).sort({ screenNumber: 1 });
        return {
          ...th.toObject(),
          screens,
        };
      })
    );
    res.json({ success: true, data: theatresWithScreens });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching theatres.' });
  }
});

// GET /api/theatres/:id
theatresRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      res.status(404).json({ success: false, message: 'Theatre not found.' });
      return;
    }
    const screens = await Screen.find({ theatre: theatre._id, active: true });
    res.json({ success: true, data: { ...theatre.toObject(), screens } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching theatre.' });
  }
});

// POST /api/theatres (Admin only)
theatresRouter.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const theatre = await Theatre.create(req.body);
    res.status(201).json({ success: true, data: theatre, message: 'Theatre created successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create theatre.' });
  }
});

// POST /api/theatres/:id/screens (Admin only)
theatresRouter.post('/:id/screens', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const theatreId = req.params.id;
    const { screenNumber, name, screenType, rows = ['A', 'B', 'C', 'D', 'E', 'F'], seatsPerRow = 10 } = req.body;

    // Generate seats
    const seats: ISeatDefinition[] = [];
    rows.forEach((row: string, rIdx: number) => {
      let category: 'standard' | 'premium' | 'vip' = 'standard';
      let multiplier = 1.0;
      if (rIdx >= rows.length - 2) {
        category = 'vip';
        multiplier = 1.6;
      } else if (rIdx >= 2) {
        category = 'premium';
        multiplier = 1.25;
      }
      for (let n = 1; n <= seatsPerRow; n++) {
        seats.push({
          seatId: `${row}${n}`,
          row,
          number: n,
          category,
          priceMultiplier: multiplier,
        });
      }
    });

    const screen = await Screen.create({
      theatre: theatreId,
      screenNumber,
      name,
      screenType: screenType || 'Dolby Cinema',
      rows,
      seatsPerRow,
      seats,
      totalSeats: seats.length,
      active: true,
    });

    res.status(201).json({ success: true, data: screen, message: 'Screen created successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create screen.' });
  }
});

// PUT /api/theatres/:id (Admin only)
theatresRouter.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await Theatre.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Theatre not found.' });
      return;
    }
    res.json({ success: true, data: updated, message: 'Theatre updated successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update theatre.' });
  }
});
