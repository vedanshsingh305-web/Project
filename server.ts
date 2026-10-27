import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
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
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json());

  // Production must have a persistent database; fail startup if initialization fails.
  try {
    await connectDB();
    await seedDatabase(false);
  } catch (err) {
    console.error('Failed to initialize MongoDB:', err);
    if (isProduction) throw err;
  }

  app.use('/api/auth', authRouter);
  app.use('/api/movies', moviesRouter);
  app.use('/api/theatres', theatresRouter);
  app.use('/api/showtimes', showtimesRouter);
  app.use('/api', seatsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/admin', adminRouter);

  app.get('/api/health', (_req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;
    res.status(databaseConnected ? 200 : 503).json({
      status: databaseConnected ? 'ok' : 'unavailable',
      service: 'IMovies API',
      timestamp: new Date().toISOString(),
      database: databaseConnected ? 'connected' : 'disconnected',
    });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IMovies server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
