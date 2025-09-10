// Dynamic import to reduce bundle size
import { getMongoose } from './dynamicImports';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://e4znHByQ3QiNgH9z:e4znHByQ3QiNgH9z@ilyaas2012.0v7gqav.mongodb.net/";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

declare global {
  var mongoose: any;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Dynamically import mongoose
    const mongoose = await getMongoose();
    
    const opts = {
      bufferCommands: false,
      dbName: 'kobac-real-estate',
      // Optimized connection pool settings for Render
      maxPoolSize: 10, // Reduced from 20 to avoid timeouts
      minPoolSize: 2, // Reduced from 5
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000, // Increased socket timeout
      connectTimeoutMS: 15000, // Increased connection timeout
      family: 4, // Use IPv4 only
      maxIdleTimeMS: 60000, // Increased idle time
      heartbeatFrequencyMS: 10000, // Standard heartbeat
      retryWrites: true,
      retryReads: true,
      compressors: 'zlib', // Enable compression
      zlibCompressionLevel: 6, // Fast compression
      // Connection resilience settings
      maxConnecting: 5, // Reduced from 10
      waitQueueTimeoutMS: 10000, // Increased from 5000
      // Read preferences
      readPreference: 'primaryPreferred', // Changed from secondaryPreferred
      // Additional stability settings
      directConnection: false,
      maxStalenessSeconds: 90,
      // Connection monitoring
      monitorCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose: any) => {
      console.log('✅ Connected to MongoDB with optimized settings');
      return mongoose;
    }).catch((error: any) => {
      console.error('❌ MongoDB connection failed:', error);
      cached.promise = null; // Reset promise on failure
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
export { connectDB as connectToDatabase };