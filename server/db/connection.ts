import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI?.trim();

  if (uri) {
    console.log('Connecting to configured MongoDB...');
    try {
      await mongoose.connect(uri);
      console.log('Connected to MongoDB successfully.');
      return mongoose;
    } catch (err) {
      console.error('Failed to connect to configured MongoDB:', (err as Error).message);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI must be configured in production. Refusing to use a temporary in-memory database.');
  }

  console.log('Starting embedded MongoDB for local development...');
  mongoMemoryServer = await MongoMemoryServer.create({
    instance: { dbName: 'imovies_db' },
  });

  await mongoose.connect(mongoMemoryServer.getUri());
  console.log('Embedded MongoDB connected successfully.');
  return mongoose;
}

export async function closeDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
