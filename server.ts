import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/db/connection.js';
import { seedDatabase } from './server/db/seed.js';
import { authRouter } from './server/routes/auth.js';
import { moviesRouter } from './server/routes/movies.js';
import { theatresRouter } from './server/routes/theatres.js';
import { showtimesRouter } from './server/routes/showtimes.js';
import { seatsRouter } from './server/routes/seats.js';
import { bookingsRouter } from './server/routes/bookings.js';
import { adminRouter } from './server/routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB & seed initial data if needed
  try {
    await connectDB();
    await seedDatabase(false);
  } catch (err) {
    console.error('Failed to initialize MongoDB:', err);
  }

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/movies', moviesRouter);
  app.use('/api/theatres', theatresRouter);
  app.use('/api/showtimes', showtimesRouter);
  app.use('/api', seatsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/admin', adminRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'IMovies API',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 IMovies Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
