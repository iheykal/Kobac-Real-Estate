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
      maxPoolSize: 5, // Further reduced for Render free tier
      minPoolSize: 1, // Minimal pool size
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 60000, // Increased socket timeout
      connectTimeoutMS: 30000, // Increased connection timeout
      family: 4, // Use IPv4 only
      maxIdleTimeMS: 300000, // 5 minutes idle time
      heartbeatFrequencyMS: 10000, // Standard heartbeat
      retryWrites: true,
      retryReads: true,
      compressors: 'zlib', // Enable compression
      zlibCompressionLevel: 6, // Fast compression
      // Connection resilience settings
      maxConnecting: 2, // Minimal connecting
      waitQueueTimeoutMS: 30000, // Increased wait timeout
      // Read preferences
      readPreference: 'primary', // Use primary for stability
      // Additional stability settings
      directConnection: false,
      maxStalenessSeconds: 90,
      // Connection monitoring
      monitorCommands: false,
      // Render-specific optimizations
      serverSelectionRetryDelayMS: 2000, // Retry delay
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