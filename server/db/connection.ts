import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to external MongoDB...');
      await mongoose.connect(uri);
      console.log('Connected to external MongoDB successfully.');
      return mongoose;
    } catch (err) {
      console.warn('Failed to connect to MONGODB_URI, falling back to embedded MongoMemoryServer:', (err as Error).message);
    }
  }

  // Fallback to high-performance local embedded MongoDB
  console.log('Starting embedded MongoDB engine (MongoMemoryServer)...');
  mongoMemoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'imovies_db',
    },
  });

  const memoryUri = mongoMemoryServer.getUri();
  console.log('Connecting to embedded MongoDB at', memoryUri);
  await mongoose.connect(memoryUri);
  console.log('MongoDB connected successfully.');
  return mongoose;
}

export async function closeDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
